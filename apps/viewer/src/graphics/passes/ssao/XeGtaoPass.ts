import {
  BlendState,
  TextureUsage,
  type Device,
  type Program,
  type Texture,
  type TextureDescriptor,
  type WebGpuTexture,
} from '@gglib/graphics'
import { vec4, vec4$init } from '@gglib/math'
import {
  FrameGraph,
  RenderChannel,
  renderChannel,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import { GBufferChannel } from '../../GBufferChannels'
import {
  XE_GTAO_DENOISE_WGSL,
  XE_GTAO_DEPTH_MIP_LEVELS,
  XE_GTAO_MAIN_WGSL,
  XE_GTAO_OCCLUSION_TERM_SCALE,
  XE_GTAO_PREFILTER_MIP0_WGSL,
  XE_GTAO_PREFILTER_MIPN_WGSL,
} from './XeGtao.wgsl'

export const NwRenderChannel = {
  /**
   * Resolved (single sample) ambient occlusion term (r, 1 = not occluded)
   */
  AmbientOcclusion: renderChannel('nw_ambient_occlusion'),
}

const AMBIENT_OCCLUSION_DESC: Readonly<TextureDescriptor> = {
  name: 'NwRenderChannel.AmbientOcclusion',
  type: '2d',
  format: 'r8unorm',
  width: 1,
  height: 1,
  depth: 1,
  sampleCount: 1,
  mipLevelCount: 1,
  usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
}

export type XeGtaoQuality = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Slice count and steps per slice, as in XeGTAO
 */
const QUALITY_PRESETS: Record<XeGtaoQuality, [number, number]> = {
  low: [1, 2],
  medium: [2, 2],
  high: [3, 3],
  ultra: [9, 3],
}

export interface XeGtaoPassOptions {
  quality?: XeGtaoQuality
  /**
   * Number of denoise passes, at least 1 (the AO is always blurred)
   */
  denoisePasses?: number
  /**
   * World space effect radius
   */
  radius?: number
  radiusMultiplier?: number
  falloffRange?: number
  sampleDistributionPower?: number
  thinOccluderCompensation?: number
  finalValuePower?: number
  depthMipSamplingOffset?: number
  denoiseBlurBeta?: number
  /**
   * View space distance beyond which no occlusion is computed. Defaults to the camera far plane
   */
  maxDistance?: number
  /**
   * Linear view space depth input
   */
  input?: RenderChannel
  /**
   * Ambient occlusion output
   */
  output?: RenderChannel
  /**
   * GBuffer A channel to read the normals from. Defaults to {@link GBufferChannel.A}
   */
  normals?: RenderChannel
}

/**
 * XeGTAO ground truth ambient occlusion (https://github.com/GameTechDev/XeGTAO)
 *
 * Reads linear view space depth and the GBuffer normals, writes the denoised occlusion term into
 * {@link NwRenderChannel.AmbientOcclusion}.
 */
export class XeGtaoPass implements RenderPass {
  public name: string = 'XeGTAO'
  /**
   * Turns the pass off. The passes that apply the AO skip it while no AO is produced.
   */
  public enabled = true

  public quality: XeGtaoQuality = 'high'
  public denoisePasses = 5
  public radius = 0.5
  public radiusMultiplier = 1.457
  public falloffRange = 0.615
  public sampleDistributionPower = 2.0
  public thinOccluderCompensation = 0.0
  public finalValuePower = 2.2
  public depthMipSamplingOffset = 3.3
  public denoiseBlurBeta = 1.2
  public maxDistance = Infinity

  /**
   * Whether the pass has been added to the current frame
   */
  public get active() {
    return this.isActive
  }

  private device: Device
  private input: RenderChannel
  private output: RenderChannel
  private isActive = false

  private prefilter0: Program
  private prefilterN: Program
  private main: Program
  private denoise: Program

  private normals: RenderChannel
  private source: FrameResource
  private target: FrameResource
  private normalSource: FrameResource

  private texDepthMips: Texture
  private texDepthMipsDesc: TextureDescriptor
  private texAo: Texture
  private texAoPong: Texture
  private texAoDesc: TextureDescriptor
  private texEdges: Texture
  private texEdgesDesc: TextureDescriptor

  private mipViews: GPUTextureView[] = []
  private mipViewsOf: GPUTexture

  private viewport = vec4()
  private ndcToView = vec4()
  private ndcToViewPx = vec4()
  private effect = vec4()
  private qualityParams = vec4()
  private denoiseParams = vec4()

  private get isReady() {
    return (
      !!this.prefilter0?.isCompiled &&
      !!this.prefilterN?.isCompiled &&
      !!this.main?.isCompiled &&
      !!this.denoise?.isCompiled
    )
  }

  public constructor(device: Device, options?: XeGtaoPassOptions) {
    this.device = device
    this.quality = options?.quality ?? this.quality
    this.denoisePasses = options?.denoisePasses ?? this.denoisePasses
    this.radius = options?.radius ?? this.radius
    this.radiusMultiplier = options?.radiusMultiplier ?? this.radiusMultiplier
    this.falloffRange = options?.falloffRange ?? this.falloffRange
    this.sampleDistributionPower = options?.sampleDistributionPower ?? this.sampleDistributionPower
    this.thinOccluderCompensation = options?.thinOccluderCompensation ?? this.thinOccluderCompensation
    this.finalValuePower = options?.finalValuePower ?? this.finalValuePower
    this.depthMipSamplingOffset = options?.depthMipSamplingOffset ?? this.depthMipSamplingOffset
    this.denoiseBlurBeta = options?.denoiseBlurBeta ?? this.denoiseBlurBeta
    this.maxDistance = options?.maxDistance ?? this.maxDistance
    this.input = options?.input ?? RenderChannel.LinearDepth
    this.output = options?.output ?? NwRenderChannel.AmbientOcclusion
    this.normals = options?.normals ?? GBufferChannel.A

    device.ready.then(() => {
      this.prefilter0 = createProgram(device, 'XeGTAO Prefilter Mip0', XE_GTAO_PREFILTER_MIP0_WGSL)
      this.prefilterN = createProgram(device, 'XeGTAO Prefilter MipN', XE_GTAO_PREFILTER_MIPN_WGSL)
      this.main = createProgram(device, 'XeGTAO Main', XE_GTAO_MAIN_WGSL)
      this.denoise = createProgram(device, 'XeGTAO Denoise', XE_GTAO_DENOISE_WGSL)
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && this.isReady
    if (!this.isActive) {
      this.source = null
      this.target = null
      return
    }

    if (this.output === NwRenderChannel.AmbientOcclusion) {
      frame.setDescriptors({ [this.output]: AMBIENT_OCCLUSION_DESC })
    }

    frame.addPass(this)
    this.source = frame.read(this.input)
    this.normalSource = frame.read(this.normals)
    this.target = frame.write(this.output)
  }

  /**
   * Acquires the working targets for the duration of {@link render}, so later passes reuse them
   */
  private acquireTargets(ctx: RenderContext) {
    const width = ctx.viewWidth
    const height = ctx.viewHeight
    const mipCount = Math.min(XE_GTAO_DEPTH_MIP_LEVELS, Math.floor(Math.log2(Math.max(width, height))) + 1)

    this.texDepthMipsDesc ||= textureDesc('r32float')
    this.texDepthMipsDesc.width = width
    this.texDepthMipsDesc.height = height
    this.texDepthMipsDesc.mipLevelCount = mipCount
    this.texDepthMips = ctx.resources.acquire(this.texDepthMipsDesc, 'XeGTAO Depth Mips')

    this.texAoDesc ||= textureDesc('r8unorm')
    this.texAoDesc.width = width
    this.texAoDesc.height = height
    this.texAo = ctx.resources.acquire(this.texAoDesc, 'XeGTAO AO')
    if (this.denoisePasses > 1) {
      this.texAoPong = ctx.resources.acquire(this.texAoDesc, 'XeGTAO AO Pong')
    }

    this.texEdgesDesc ||= textureDesc('rgba8unorm')
    this.texEdgesDesc.width = width
    this.texEdgesDesc.height = height
    this.texEdges = ctx.resources.acquire(this.texEdgesDesc, 'XeGTAO Edges')
  }

  private releaseTargets(ctx: RenderContext) {
    if (this.texDepthMips) {
      ctx.resources.release(this.texDepthMips)
      this.texDepthMips = null
    }
    if (this.texAo) {
      ctx.resources.release(this.texAo)
      this.texAo = null
    }
    if (this.texAoPong) {
      ctx.resources.release(this.texAoPong)
      this.texAoPong = null
    }
    if (this.texEdges) {
      ctx.resources.release(this.texEdges)
      this.texEdges = null
    }
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }

    this.acquireTargets(ctx)
    const pass = ctx.device.renderPass
    pass.flush()
    this.updateParams(ctx)

    // depth mip 0
    this.prefilter0.mustSet('sourceDepth', this.source.texture)
    this.draw(ctx, this.prefilter0, this.texDepthMips, 0)

    // depth mip 1..N
    const mipViews = this.getMipViews(this.texDepthMips)
    this.setParams(this.prefilterN)
    for (let mip = 1; mip < mipViews.length; mip++) {
      this.prefilterN.mustGet('sourceDepth').set(mipViews[mip - 1] as any)
      this.draw(ctx, this.prefilterN, this.texDepthMips, mip)
    }

    // main pass, writes working ao term and edges
    this.setParams(this.main)
    this.main.mustSet('depthMips', this.texDepthMips)
    this.main.mustSet('normalParams.viewMatrix', ctx.view.camera.view)
    this.main.mustSet('gbufferA', this.normalSource.texture)
    pass.setRenderTarget(1, this.texEdges)
    pass.setRenderBlend(1, BlendState.Opaque)
    this.draw(ctx, this.main, this.texAo, 0)
    pass.setRenderTarget(1, null)

    // denoise, the last pass writes the final term into the output channel
    // always blurred, at least one pass
    const passes = Math.max(1, this.denoisePasses)
    const beta = this.denoiseBlurBeta
    let src = this.texAo
    let tmp = this.texAoPong
    this.denoise.mustSet('edgesMap', this.texEdges)
    for (let i = 0; i < passes; i++) {
      const isFinal = i === passes - 1
      const dst = isFinal ? this.target.texture : tmp
      this.denoiseParams.x = isFinal ? beta : beta / 5
      this.denoiseParams.y = isFinal ? XE_GTAO_OCCLUSION_TERM_SCALE : 1
      this.denoise.mustSet('params.values', this.denoiseParams)
      this.denoise.mustSet('aoTerm', src)
      this.draw(ctx, this.denoise, dst, 0)
      tmp = src
      src = dst
    }

    pass.flush()
    this.releaseTargets(ctx)
  }

  public cleanup(ctx: RenderContext): void {
    // released at the end of render, this only runs if the render threw
    this.releaseTargets(ctx)
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

  private getMipViews(texture: Texture): GPUTextureView[] {
    const gpuTexture = (texture as WebGpuTexture).gpuObject
    if (this.mipViewsOf !== gpuTexture || this.mipViews.length !== texture.mipLevelCount) {
      this.mipViewsOf = gpuTexture
      this.mipViews.length = 0
      for (let mip = 0; mip < texture.mipLevelCount; mip++) {
        this.mipViews.push(
          gpuTexture.createView({
            label: `XeGTAO Depth Mip ${mip}`,
            dimension: '2d',
            baseMipLevel: mip,
            mipLevelCount: 1,
          }),
        )
      }
    }
    return this.mipViews
  }

  private updateParams(ctx: RenderContext) {
    const camera = ctx.view.camera
    const proj = camera.projection
    const width = ctx.viewWidth
    const height = ctx.viewHeight

    // right handed view space looking down -z is mapped to XeGTAO view space (x right, y up, z = linear depth)
    const mulX = 2 / proj[0]
    const mulY = -2 / proj[5]
    const addX = (proj[8] - 1) / proj[0]
    const addY = (proj[9] + 1) / proj[5]

    vec4$init(this.viewport, width, height, 1 / width, 1 / height)
    vec4$init(this.ndcToView, mulX, mulY, addX, addY)
    vec4$init(
      this.ndcToViewPx,
      mulX / width,
      mulY / height,
      this.depthMipSamplingOffset,
      Math.min(this.maxDistance, camera.far * 0.99),
    )
    vec4$init(
      this.effect,
      this.radius * this.radiusMultiplier,
      this.falloffRange,
      this.sampleDistributionPower,
      this.thinOccluderCompensation,
    )

    const [slices, steps] = QUALITY_PRESETS[this.quality] ?? QUALITY_PRESETS.high
    vec4$init(this.qualityParams, slices, steps, this.finalValuePower, 0)
  }

  private setParams(program: Program) {
    program.set('params.viewport', this.viewport)
    program.set('params.ndcToView', this.ndcToView)
    program.set('params.ndcToViewPx', this.ndcToViewPx)
    program.set('params.effect', this.effect)
    program.set('params.quality', this.qualityParams)
  }
}

function createProgram(device: Device, name: string, source: string): Program {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}

function textureDesc(format: GPUTextureFormat): TextureDescriptor {
  return {
    type: '2d',
    format,
    width: 1,
    height: 1,
    depth: 1,
    mipLevelCount: 1,
    sampleCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
}
