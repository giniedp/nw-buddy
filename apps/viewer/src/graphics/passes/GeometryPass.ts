import {
  BlendState,
  Color,
  CullState,
  DepthState,
  RenderVariant,
  StencilState,
  type TextureDescriptor,
} from '@gglib/graphics'
import {
  RenderChannel,
  RenderListMode,
  type FrameGraph,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import type { IVec4 } from '@gglib/math'

function clearValue(clear: GeometryPassChannel['clear'], ctx: RenderContext): IVec4 {
  return typeof clear === 'function' ? clear(ctx) : clear
}

// Fork of the gglib GeometryPass (packages/render/src/passes/GeometryPass.ts) for the viewer pipeline.
// Differences:
// - `channels` may be empty: a depth only pass (e.g. shadow maps). The viewport then follows the depth target.
// - `variant` selects the material effect variant (RenderVariant) the list is collected and drawn with.
//   Render lists are cached per (mode, variant), so passes with the same mode and variant share one list.
// - `clear` may be a function of the render context (e.g. the far plane for the linear depth)
// - single sample only, no MSAA resolve (the viewer pipeline has no MSAA, plan phase 6)

/**
 * Describes a render target of the {@link GeometryPass}
 */
export interface GeometryPassChannel {
  /**
   * Channel the geometry is rendered into
   */
  render: RenderChannel
  /**
   * Clear color, or a function that returns it per frame (e.g. the camera far plane for a linear depth channel).
   * If set, the channel is cleared and written as a new resource.
   * Otherwise the geometry is rendered on top of the existing content (modified in place).
   */
  clear: Color | ((ctx: RenderContext) => IVec4) | null
  /**
   * Blend state of the channel. Defaults to opaque.
   */
  blend?: BlendState
}

export interface GeometryPassOptions {
  name?: string
  /**
   * The geometry list to render. Defaults to {@link RenderListMode.Opaque}
   */
  list: RenderListMode
  /**
   * The material effect variant to render with. Defaults to {@link RenderVariant.Forward}
   */
  variant?: RenderVariant
  /**
   * The render targets. May be empty for a depth only pass.
   */
  channels: GeometryPassChannel[]
  /**
   * The depth target
   */
  depth: RenderChannel
  /**
   * Whether to clear the depth target. If not set, the depth target is modified in place.
   */
  clearDepth: boolean
  /**
   * Channels that are sampled by materials (e.g. scene color or scene depth of a previous pass).
   * Declared as reads, so the frame graph keeps them alive during this pass.
   */
  inputs?: RenderChannel[]
  /**
   * Descriptors of custom channels this pass writes (registered on the frame graph in setup)
   */
  descriptors?: Record<RenderChannel, Readonly<TextureDescriptor>>
  /**
   * Stencil state of the pass, e.g. to write the decal receiver bit. The list sets the reference per draw
   * (`RenderListLayers.stencilReference`). Defaults to {@link StencilState.Default} (disabled).
   */
  stencil?: StencilState
}

/**
 * Renders a geometry list into a set of render targets.
 * Covers the opaque case (cleared targets) as well as the transparent case (render on top of existing targets).
 */
export class GeometryPass implements RenderPass {
  public name: string = 'GeometryPass'
  /**
   * Skips the pass. Only safe for passes that render on top of existing targets: a pass that clears its targets
   * produces channels later passes read.
   */
  public enabled = true

  private list: RenderListMode
  private variant: RenderVariant
  private channels: GeometryPassChannel[]
  private depth: RenderChannel
  private clearDepth: boolean
  private inputs: RenderChannel[]
  private descriptors: Record<RenderChannel, Readonly<TextureDescriptor>> | null
  private stencil: StencilState
  private hasClear: boolean

  private depthResource: FrameResource
  private renderResources: FrameResource[] = []
  private frame: FrameGraph<RenderPass>
  // whether clearing and drawing can share one render pass: all targets are cleared, or none
  private singlePass: boolean

  public constructor(options: GeometryPassOptions) {
    this.name = options?.name ?? this.name
    this.list = options?.list ?? RenderListMode.Opaque
    this.variant = options?.variant ?? RenderVariant.Forward
    this.channels = options?.channels ?? []
    this.depth = options?.depth ?? RenderChannel.Depth
    this.clearDepth = options?.clearDepth ?? false
    this.inputs = options?.inputs ?? []
    this.descriptors = options?.descriptors ?? null
    this.stencil = options?.stencil ?? StencilState.Default
    this.hasClear = this.clearDepth || this.channels.some((it) => !!it.clear)
    this.singlePass = !this.hasClear || (this.clearDepth && this.channels.every((it) => !!it.clear))
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled) {
      return
    }
    this.frame = frame
    if (this.descriptors) {
      frame.setDescriptors(this.descriptors)
    }
    frame.addPass(this)

    // reads first, so that a subsequent write of the same channel creates a new version
    for (const channel of this.inputs) {
      frame.read(channel)
    }

    if (this.clearDepth) {
      this.depthResource = frame.write(this.depth)
    } else {
      this.depthResource = frame.modifyInPlace(this.depth)
    }

    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i]
      this.renderResources[i] = channel.clear ? frame.write(channel.render) : frame.modifyInPlace(channel.render)
    }
  }

  /**
   * Whether no later pass needs the content of the resource
   */
  private isLastUse(resource: FrameResource) {
    return !resource.exported && this.frame.nodes[resource.lastUse]?.pass === this
  }

  public render(ctx: RenderContext): void {
    const pass = ctx.device.renderPass
    const viewport = this.renderResources[0]?.texture ?? this.depthResource.texture
    const variant = ctx.renderVariant
    ctx.renderVariant = this.variant

    pass.flush()
    pass.setAsync(true)
    pass.setCullState(CullState.CullBack)
    pass.setStencilState(this.stencil)
    pass.setViewportState(0, 0, viewport.width, viewport.height)

    try {
      if (this.singlePass) {
        this.renderSinglePass(ctx)
      } else {
        this.renderSeparateClear(ctx)
      }
    } finally {
      ctx.renderVariant = variant
      pass.setStencilState(StencilState.Default)
      pass.setStencilReference(0)
    }
    pass.flush()
  }

  /**
   * Clears and draws in one render pass. Targets that no later pass uses are discarded, so they are never stored
   */
  private renderSinglePass(ctx: RenderContext) {
    const pass = ctx.device.renderPass
    const targets = this.renderResources

    pass.setDepthTarget(this.depthResource.texture)
    pass.setDepthDiscard(this.isLastUse(this.depthResource))
    for (let i = 0; i < this.channels.length; i++) {
      pass.setRenderTarget(i, targets[i].texture)
      pass.setDiscard(i, this.isLastUse(targets[i]))
      pass.setRenderBlend(i, this.channels[i].blend ?? BlendState.Opaque)
      if (this.channels[i].clear) {
        pass.setClearColor(i, clearValue(this.channels[i].clear, ctx))
      }
    }
    if (this.hasClear) {
      pass.setClearDepth(ctx.view.camera.reversedZ ? 0 : 1)
      pass.clear()
    }
    pass.setDepthState(ctx.view.camera.reversedZ ? DepthState.GreaterEqual : DepthState.LessEqual)
    pass.render(ctx.renderer.getList(this.list, ctx))
    pass.submit()

    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    for (let i = 0; i < targets.length; i++) {
      pass.setRenderTarget(i, null)
    }
  }

  /**
   * Clears some targets and loads others, so clearing needs its own pass
   */
  private renderSeparateClear(ctx: RenderContext) {
    const pass = ctx.device.renderPass
    const targets = this.renderResources

    // #region Clear
    if (this.hasClear) {
      pass.setDepthTarget(this.clearDepth ? this.depthResource.texture : null)
      pass.setClearDepth(ctx.view.camera.reversedZ ? 0 : 1)
      for (let i = 0; i < this.channels.length; i++) {
        const clear = this.channels[i].clear
        if (clear) {
          pass.setRenderTarget(i, targets[i].texture)
          pass.setClearColor(i, clearValue(clear, ctx))
        } else {
          pass.setRenderTarget(i, null)
        }
      }
      pass.clear()
    }
    // #endregion

    // #region Render
    pass.setDepthTarget(this.depthResource.texture)
    pass.setDepthState(ctx.view.camera.reversedZ ? DepthState.GreaterEqual : DepthState.LessEqual)
    for (let i = 0; i < this.channels.length; i++) {
      pass.setRenderTarget(i, targets[i].texture)
      pass.setRenderBlend(i, this.channels[i].blend ?? BlendState.Opaque)
    }
    pass.render(ctx.renderer.getList(this.list, ctx))
    pass.submit()

    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    for (let i = 0; i < targets.length; i++) {
      pass.setRenderTarget(i, null)
    }
    // #endregion
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
