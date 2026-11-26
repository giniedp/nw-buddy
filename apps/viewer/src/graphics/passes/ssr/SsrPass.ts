import {
  BlendState,
  CommonInputs,
  DepthState,
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type Texture,
  type TextureDescriptor,
  type TextureView,
  type WebGpuDevice,
} from '@gglib/graphics'
import { vec4, type IVec3, type Mat4 } from '@gglib/math'
import {
  FrameGraph,
  renderChannel,
  RenderChannel,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import { InputSlots } from '../../../material/common'
import type { LuminancePass } from '../exposure/LuminancePass'
import type { PreviousColorPass } from '../history/PreviousColorPass'
import {
  HIZ_DOWNSAMPLE_WGSL,
  PYRAMID_WORKGROUP_SIZE,
  SSR_DEBUG_WGSL,
  SsrDebugModes,
  type SsrDebugMode,
} from './Ssr.wgsl'
import { SsrTraceEffect } from './SsrTraceEffect'

export const SsrChannel = {
  /**
   * Screen space reflections: rgb = reflected color, a = confidence (0 = use the probe), read by the LightingPass
   */
  Reflections: renderChannel('nw_ssr_reflections'),
}

const REFLECTIONS_DESC: Readonly<TextureDescriptor> = {
  name: 'SsrChannel.Reflections',
  type: '2d',
  format: 'rgba16float',
  width: 1,
  height: 1,
  depth: 1,
  sampleCount: 1,
  mipLevelCount: 1,
  usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding,
}

const CLEAR_NO_HIT = vec4(0, 0, 0, 0)

export interface SsrPassOptions {
  /**
   * The previous frame color with its blurred mips (the hit color source)
   */
  previousColor: PreviousColorPass
  /**
   * GBuffer normals (a) and smoothness (c.r), layout in material/gbuffer.wgsl.ts
   */
  gbufferA: RenderChannel
  gbufferC: RenderChannel
  /**
   * The adapted luminance of the previous frame for the hit brightness clamp (no clamp without it)
   */
  luminance?: LuminancePass
  /**
   * Linear view depth, default {@link RenderChannel.LinearDepth}
   */
  linearDepth?: RenderChannel
}

/**
 * Screen space reflections before the deferred lighting, like the game's SSR_Raytrace (deferredshading.cfx), with a
 * Hi-Z march and cone tracing instead of the linear march:
 * 1. Hi-Z pyramid: min linear depth per mip, from the current frame
 * 2. trace ({@link SsrTraceEffect}) against the pyramid, hit color from the previous frame color pyramid
 *    ({@link PreviousColorPass})
 *
 * Output {@link SsrChannel.Reflections}.
 */
export class SsrPass implements RenderPass {
  public name = 'SsrPass'
  public enabled = true
  /**
   * 'hiz' / 'color' write the pyramid mip {@link debugMip} into the output, shown by the LightingPass 'reflections'
   * debug mode
   */
  public debug: SsrDebugMode = 'off'
  public debugMip = 0
  /**
   * Times the render encoder part (Hi-Z pyramid), set by the pipeline UI
   */
  public gpuTimer?: GpuTimer
  /**
   * Times the trace (compute encoder), the pipeline timer does not cover compute passes
   */
  public traceTimer?: GpuTimer
  /**
   * The trace with its parameters
   */
  public readonly effect: SsrTraceEffect

  private previousColor: PreviousColorPass
  private linearDepth: RenderChannel
  private gbufferAChannel: RenderChannel
  private gbufferCChannel: RenderChannel
  private luminance: LuminancePass | null
  private hizProgram: Program
  private debugProgram: Program
  private isActive = false
  private source: FrameResource | null = null
  private gbufferA: FrameResource | null = null
  private gbufferC: FrameResource | null = null
  private target: FrameResource | null = null
  private hizDesc: TextureDescriptor = {
    ...REFLECTIONS_DESC,
    name: 'SSR Hi-Z',
    format: 'r32float',
    usage: TextureUsage.TextureBinding | TextureUsage.StorageBinding,
  }
  private hitsDesc: TextureDescriptor = {
    ...REFLECTIONS_DESC,
    name: 'SSR Hits',
    format: 'rgba32float',
    usage: TextureUsage.TextureBinding | TextureUsage.StorageBinding,
  }
  private hiZ: Texture | null = null
  private publishedParams = vec4(0)
  private hizViews: TextureView[] = []
  private hizViewsOf: Texture | null = null
  private debugParams = new Float32Array(4)

  public constructor(device: Device, options: SsrPassOptions) {
    this.previousColor = options.previousColor
    this.linearDepth = options.linearDepth ?? RenderChannel.LinearDepth
    this.gbufferAChannel = options.gbufferA
    this.gbufferCChannel = options.gbufferC
    this.luminance = options.luminance ?? null
    this.effect = new SsrTraceEffect(device)
    device.ready.then(() => {
      this.hizProgram = createProgram(device, 'SSR Hi-Z', HIZ_DOWNSAMPLE_WGSL)
      this.debugProgram = createProgram(device, 'SSR Debug', SSR_DEBUG_WGSL)
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive =
      this.enabled && !!this.hizProgram?.isCompiled && !!this.debugProgram?.isCompiled && this.effect.isCompiled
    if (!this.isActive) {
      this.source = null
      this.target = null
      // materials (%SSREFL) fall back to their env reflection
      this.publishedParams.x = 0
      ctx.renderInputs.set(InputSlots.View.Ssr, this.publishedParams)
      return
    }
    frame.setDescriptors({ [SsrChannel.Reflections]: REFLECTIONS_DESC })
    frame.addPass(this)
    this.source = frame.read(this.linearDepth)
    this.gbufferA = frame.read(this.gbufferAChannel)
    this.gbufferC = frame.read(this.gbufferCChannel)
    this.target = frame.write(SsrChannel.Reflections)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    pass.flush()
    const hiZ = this.ensureHiZ(ctx)
    this.buildHiZ(ctx, hiZ)
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)

    const target = this.target.texture
    const previous = this.previousColor.texture
    // the pyramids for the materials with screen space reflections (water), drawn later in this frame
    const params = this.publishedParams
    params.x = previous && this.previousColor.isPreviousFrame(ctx.frame.id, target.width, target.height) ? 1 : 0
    params.y = hiZ.mipLevelCount
    params.z = this.effect.maxDistance
    params.w = this.effect.maxIterations
    ctx.renderInputs.set(InputSlots.View.Ssr, params)
    ctx.renderInputs.set(InputSlots.View.HiZMap, hiZ)
    const debugMode = SsrDebugModes.indexOf(this.debug)
    if (debugMode > 0 && previous) {
      const mipCount = debugMode === 1 ? hiZ.mipLevelCount : previous.mipLevelCount
      this.debugParams[0] = debugMode
      this.debugParams[1] = Math.min(Math.max(Math.round(this.debugMip), 0), mipCount - 1)
      this.debugParams[2] = ctx.view.camera.far
      const program = this.debugProgram
      program.mustSet('params.values', this.debugParams)
      program.mustSet('hiZ', hiZ)
      program.mustSet('colorPyramid', previous)
      program.mustSet('linearSampler', SamplerState.LinearClamp)
      this.draw(ctx, program, target, 0)
      pass.flush()
    } else if (previous && this.previousColor.isPreviousFrame(ctx.frame.id, target.width, target.height)) {
      pass.flush()
      this.trace(ctx, hiZ, previous, target)
    } else {
      // no previous frame (first frame, resize): zero confidence everywhere
      pass.setRenderTarget(0, target)
      pass.setClearColor(0, CLEAR_NO_HIT)
      pass.clear()
      pass.submit()
      pass.setRenderTarget(0, null)
      pass.flush()
    }
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  public dispose() {
    this.effect.dispose()
    this.hiZ?.dispose()
    this.hiZ = null
  }

  private trace(ctx: RenderContext, hiZ: Texture, previous: Texture, target: Texture) {
    const camera = ctx.view.camera
    const effect = this.effect
    effect.setCamera(
      camera.projection,
      camera.view,
      ctx.renderInputs.get(InputSlots.View.PreviousViewProjectionMatrix) as Mat4 | null,
      ctx.renderInputs.get(InputSlots.View.CameraPosition) as IVec3,
      ctx.renderInputs.get(CommonInputs.View.CameraDirection) as IVec3,
      camera.near,
      camera.far,
    )
    effect.params.gbufferA = this.gbufferA.texture
    effect.params.gbufferC = this.gbufferC.texture
    const hitsDesc = this.hitsDesc
    hitsDesc.width = target.width
    hitsDesc.height = target.height
    const hits = ctx.resources.acquire(hitsDesc, 'SSR Hits')

    const pass = (ctx.device as WebGpuDevice).computePass
    if (this.traceTimer) {
      pass.beginTimer(this.traceTimer)
    }
    effect.render(pass, this.source.texture, hiZ, previous, this.luminance?.adaptedLuminance ?? null, hits, target)
    if (this.traceTimer) {
      pass.endTimer(this.traceTimer)
    }
    pass.flush()
    ctx.resources.release(hits)
  }

  /**
   * Hi-Z levels 1.. into the mips of the half resolution pyramid, level 1 from the linear depth
   */
  private buildHiZ(ctx: RenderContext, hiZ: Texture) {
    const views = this.getHiZViews(hiZ)
    const program = this.hizProgram
    const pass = (ctx.device as WebGpuDevice).computePass
    if (this.gpuTimer) {
      pass.beginTimer(this.gpuTimer)
    }
    for (let mip = 0; mip < hiZ.mipLevelCount; mip++) {
      program.mustSet('source', mip === 0 ? this.source.texture : views[mip - 1])
      program.mustSet('destination', views[mip])
      program.commit()
      pass.setProgram(program)
      pass.dispatch(
        Math.ceil(Math.max(1, hiZ.width >> mip) / PYRAMID_WORKGROUP_SIZE),
        Math.ceil(Math.max(1, hiZ.height >> mip) / PYRAMID_WORKGROUP_SIZE),
      )
    }
    if (this.gpuTimer) {
      pass.endTimer(this.gpuTimer)
    }
    pass.flush()
  }

  /**
   * Single mip views of the pyramid, kept while the pooled texture stays the same
   */
  private getHiZViews(hiZ: Texture): TextureView[] {
    if (this.hizViewsOf !== hiZ || this.hizViews.length !== hiZ.mipLevelCount) {
      this.hizViewsOf = hiZ
      this.hizViews.length = 0
      for (let mip = 0; mip < hiZ.mipLevelCount; mip++) {
        this.hizViews.push(hiZ.subresource(mip, 1))
      }
    }
    return this.hizViews
  }

  /**
   * The pyramid is owned by the pass, not pooled: the water materials read it in the transparent passes
   */
  private ensureHiZ(ctx: RenderContext): Texture {
    const width = Math.max(1, ctx.viewWidth >> 1)
    const height = Math.max(1, ctx.viewHeight >> 1)
    if (this.hiZ && this.hiZ.width === width && this.hiZ.height === height) {
      return this.hiZ
    }
    this.hiZ?.dispose()
    const desc = this.hizDesc
    desc.width = width
    desc.height = height
    desc.mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1
    this.hiZ = ctx.device.createTexture(desc)
    return this.hiZ
  }

  private draw(ctx: RenderContext, program: Program, target: Texture, mipLevel: number) {
    const pass = ctx.device.renderPass
    program.commit()
    pass.setRenderTarget(0, target, mipLevel)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, Math.max(1, target.width >> mipLevel), Math.max(1, target.height >> mipLevel))
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
  }
}

function createProgram(device: Device, name: string, source: string): Program {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}
