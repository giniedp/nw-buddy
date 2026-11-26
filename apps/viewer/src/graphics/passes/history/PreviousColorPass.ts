import {
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type Texture,
  type TextureView,
  type WebGpuDevice,
} from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import { COLOR_COPY_WGSL, COLOR_MIPN_WGSL, PYRAMID_WORKGROUP_SIZE } from '../ssr/Ssr.wgsl'

/**
 * Mips of the color pyramid: mip 8 of a 2560 px wide frame is 10 px, blurrier cones fall back to the probes
 */
const MAX_MIP_LEVELS = 9

export interface PreviousColorPassOptions {
  /**
   * The HDR color channel to keep, default {@link RenderChannel.Color}
   */
  input?: RenderChannel
}

/**
 * Keeps the HDR scene color of a frame for the next one, like the game's `$HDRTargetPrev` (D3DHDRRender.cpp: copied in
 * the HDR post processing after the transparents, before depth of field and motion blur), the hit color source of the
 * screen space reflections (SSR_Raytrace), with blurred mips for the cone tracing.
 *
 * The copy is a persistent texture owned by the pass, not a frame graph channel: it is read in the next frame, before
 * this pass runs again. It is published as `view.previousSceneColorMap`. Compute only: one compute pass for the copy
 * and the mip chain.
 */
export class PreviousColorPass implements RenderPass {
  public name = 'PreviousColor'
  public enabled = true
  /**
   * Set by the pipeline UI, timed on the compute encoder (the pipeline only times the render encoder)
   */
  public gpuTimer?: GpuTimer

  /**
   * The color of the previous frame, null until the first copy
   */
  public get texture(): Texture | null {
    return this.target
  }

  private input: RenderChannel
  private copyProgram: Program
  private mipProgram: Program
  private source: FrameResource
  private target: Texture | null = null
  private mipViews: TextureView[] = []
  private copiedFrame = -1
  private isActive = false

  public constructor(device: Device, options: PreviousColorPassOptions = {}) {
    this.input = options.input ?? RenderChannel.Color
    device.ready.then(() => {
      this.copyProgram = device
        .createShaderModule({ name: 'NW Previous Color', wgsl: { source: COLOR_COPY_WGSL } })
        .program.clone()
      this.mipProgram = device
        .createShaderModule({ name: 'NW Previous Color Mip', wgsl: { source: COLOR_MIPN_WGSL } })
        .program.clone()
    })
  }

  /**
   * Whether {@link texture} holds the color of the frame before the given one at the given size, i.e. the copy is
   * usable as the previous frame (not after a resize, a skipped frame or while disabled)
   */
  public isPreviousFrame(frameId: number, width: number, height: number): boolean {
    const target = this.target
    return !!target && this.copiedFrame === frameId - 1 && target.width === width && target.height === height
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && !!this.copyProgram?.isCompiled && !!this.mipProgram?.isCompiled
    if (!this.isActive) {
      // the texture stays (it may still be bound as an input), isPreviousFrame turns false
      return
    }
    frame.addPass(this)
    // the copy is read by the next frame, the frame graph sees no consumer
    frame.keepAlive()
    this.source = frame.read(this.input)
  }

  public render(ctx: RenderContext): void {
    const source = this.source.texture
    const target = this.ensureTarget(ctx.device, source.width, source.height)
    // render work on the source must be submitted before the compute pass reads it
    ctx.device.renderPass.flush()

    const pass = (ctx.device as WebGpuDevice).computePass
    if (this.gpuTimer) {
      pass.beginTimer(this.gpuTimer)
    }
    const copy = this.copyProgram
    copy.mustSet('source', source)
    copy.mustSet('destination', this.mipViews[0])
    copy.commit()
    pass.setProgram(copy)
    pass.dispatch(Math.ceil(target.width / PYRAMID_WORKGROUP_SIZE), Math.ceil(target.height / PYRAMID_WORKGROUP_SIZE))

    // the blurred mips (the cone tracing source), each from the one above
    const mip = this.mipProgram
    mip.mustSet('linearSampler', SamplerState.LinearClamp)
    for (let level = 1; level < target.mipLevelCount; level++) {
      mip.mustSet('source', this.mipViews[level - 1])
      mip.mustSet('destination', this.mipViews[level])
      mip.commit()
      pass.setProgram(mip)
      pass.dispatch(
        Math.ceil(Math.max(1, target.width >> level) / PYRAMID_WORKGROUP_SIZE),
        Math.ceil(Math.max(1, target.height >> level) / PYRAMID_WORKGROUP_SIZE),
      )
    }
    if (this.gpuTimer) {
      pass.endTimer(this.gpuTimer)
    }
    pass.flush()
    this.copiedFrame = ctx.frame.id
    ctx.renderInputs.set(InputSlots.View.PreviousSceneColorMap, target)
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  public dispose() {
    this.target?.dispose()
    this.target = null
  }

  private ensureTarget(device: Device, width: number, height: number): Texture {
    const target = this.target
    if (target && target.width === width && target.height === height) {
      return target
    }
    target?.dispose()
    this.copiedFrame = -1
    this.target = device.createTexture({
      name: 'NW Previous Color',
      type: '2d',
      format: 'rgba16float',
      width,
      height,
      depth: 1,
      sampleCount: 1,
      mipLevelCount: Math.min(MAX_MIP_LEVELS, Math.floor(Math.log2(Math.max(width, height))) + 1),
      usage: TextureUsage.TextureBinding | TextureUsage.StorageBinding,
    })
    // single mip views: storage targets and the sources of the next mip
    this.mipViews.length = 0
    for (let level = 0; level < this.target.mipLevelCount; level++) {
      this.mipViews.push(this.target.subresource(level, 1))
    }
    return this.target
  }
}
