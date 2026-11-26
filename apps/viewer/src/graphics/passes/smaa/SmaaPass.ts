import {
  SamplerState,
  TextureUsage,
  type Device,
  type Program,
  type Texture,
  type TextureDescriptor,
  type WebGpuDevice,
  type WebGpuTexture,
} from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import areaTexUrl from './smaa-area-160x560.rg8.bin?url'
import searchTexUrl from './smaa-search-66x33.r8.bin?url'
import { SMAA_BLEND_WGSL, SMAA_EDGES_WGSL, SMAA_WEIGHTS_WGSL } from './SmaaPass.wgsl'

export type SmaaPreset = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Threshold, max search steps, max diagonal search steps, corner rounding (SMAA.hlsl presets).
 * The game compiles "medium".
 */
const PRESETS: Record<SmaaPreset, [number, number, number, number]> = {
  low: [0.15, 4, 0, 0],
  medium: [0.1, 8, 0, 0],
  high: [0.1, 16, 8, 25],
  ultra: [0.05, 32, 16, 25],
}

export const SmaaDebugModes = ['off', 'edges', 'weights'] as const
export type SmaaDebugMode = (typeof SmaaDebugModes)[number]

export interface SmaaPassOptions {
  enabled?: boolean
  preset?: SmaaPreset
}

/**
 * SMAA 1x on the final, display encoded image (after the film mapping, like the game). Three passes: luma edge
 * detection with depth predication, blending weights, neighborhood blending. See SmaaPass.wgsl.ts.
 */
export class SmaaPass implements RenderPass {
  public name: string = 'SMAA'
  public enabled = true
  public debug: SmaaDebugMode = 'off'

  public threshold = 0.05
  public maxSearchSteps = 32
  public maxSearchStepsDiag = 16
  public cornerRounding = 25
  /**
   * Lowers the threshold at depth discontinuities (SMAA predication)
   */
  public predication = true
  /**
   * Relative depth difference that counts as a depth edge
   */
  public predicationThreshold = 0.01
  public predicationScale = 2
  public predicationStrength = 0.4

  /**
   * Applies the quality settings of an SMAA.hlsl preset
   */
  public set preset(value: SmaaPreset) {
    const [threshold, steps, diag, corners] = PRESETS[value] ?? PRESETS.ultra
    this.threshold = threshold
    this.maxSearchSteps = steps
    this.maxSearchStepsDiag = diag
    this.cornerRounding = corners
    this.currentPreset = value
  }
  public get preset(): SmaaPreset {
    return this.currentPreset
  }

  private currentPreset: SmaaPreset = 'ultra'
  private device: Device
  private edgesProgram: Program
  private weightsProgram: Program
  private blendProgram: Program
  private areaTex: Texture | null = null
  private searchTex: Texture | null = null
  private isActive = false

  private source: FrameResource
  private depth: FrameResource
  private target: FrameResource
  private edgesDesc: TextureDescriptor = targetDesc('rg8unorm')
  private weightsDesc: TextureDescriptor = targetDesc('rgba8unorm')
  private edges: Texture | null = null
  private weights: Texture | null = null

  private rt = new Float32Array(4)
  private quality = new Float32Array(4)
  private predicationParams = new Float32Array(4)
  private debugParams = new Float32Array(4)

  private get isReady() {
    return (
      !!this.areaTex &&
      !!this.searchTex &&
      !!this.edgesProgram?.isCompiled &&
      !!this.weightsProgram?.isCompiled &&
      !!this.blendProgram?.isCompiled
    )
  }

  public constructor(device: Device, options?: SmaaPassOptions) {
    this.device = device
    this.enabled = options?.enabled ?? this.enabled
    this.preset = options?.preset ?? 'ultra'
    device.ready.then(() => {
      this.edgesProgram = createProgram(device, 'SMAA Edges', SMAA_EDGES_WGSL)
      this.weightsProgram = createProgram(device, 'SMAA Weights', SMAA_WEIGHTS_WGSL)
      this.blendProgram = createProgram(device, 'SMAA Blend', SMAA_BLEND_WGSL)
      this.loadLookupTextures().catch((err) => console.error('SMAA lookup textures not loaded', err))
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && this.isReady
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.depth = frame.read(RenderChannel.LinearDepth)
    this.target = frame.write(RenderChannel.Color)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    // acquired for the duration of the pass, so later passes reuse the targets
    this.edgesDesc.width = this.weightsDesc.width = ctx.viewWidth
    this.edgesDesc.height = this.weightsDesc.height = ctx.viewHeight
    this.edges = ctx.resources.acquire(this.edgesDesc, 'SMAA Edges')
    this.weights = ctx.resources.acquire(this.weightsDesc, 'SMAA Weights')

    const target = this.target.texture
    this.rt[0] = 1 / target.width
    this.rt[1] = 1 / target.height
    this.rt[2] = target.width
    this.rt[3] = target.height
    this.quality[0] = this.threshold
    this.quality[1] = this.maxSearchSteps
    this.quality[2] = this.maxSearchStepsDiag
    this.quality[3] = this.cornerRounding
    this.predicationParams[0] = this.predication ? 1 : 0
    this.predicationParams[1] = this.predicationThreshold
    this.predicationParams[2] = this.predicationScale
    this.predicationParams[3] = this.predicationStrength
    this.debugParams[0] = SmaaDebugModes.indexOf(this.debug)

    const pass = ctx.device.renderPass
    pass.flush()

    const edges = this.edgesProgram
    this.setParams(edges)
    edges.mustSet('colorTex', this.source.texture)
    edges.mustSet('depthTex', this.depth.texture)
    this.draw(ctx, edges, this.edges)

    const weights = this.weightsProgram
    this.setParams(weights)
    weights.mustSet('edgesTex', this.edges)
    weights.mustSet('areaTex', this.areaTex)
    weights.mustSet('searchTex', this.searchTex)
    weights.mustSet('linearSampler', SamplerState.LinearClamp)
    weights.mustSet('pointSampler', SamplerState.PointClamp)
    this.draw(ctx, weights, this.weights)

    const blend = this.blendProgram
    this.setParams(blend)
    blend.mustSet('colorTex', this.source.texture)
    blend.mustSet('blendTex', this.weights)
    blend.mustSet('edgesTex', this.edges)
    this.draw(ctx, blend, target)

    pass.flush()
    this.releaseTargets(ctx)
  }

  public cleanup(ctx: RenderContext): void {
    // released at the end of render, this only runs if the render threw
    this.releaseTargets(ctx)
  }

  private releaseTargets(ctx: RenderContext) {
    if (this.edges) {
      ctx.resources.release(this.edges)
      this.edges = null
    }
    if (this.weights) {
      ctx.resources.release(this.weights)
      this.weights = null
    }
  }

  private setParams(program: Program) {
    program.set('params.rt', this.rt)
    program.set('params.quality', this.quality)
    program.set('params.predication', this.predicationParams)
    program.set('params.debug', this.debugParams)
  }

  private draw(ctx: RenderContext, program: Program, target: Texture) {
    const pass = ctx.device.renderPass
    program.commit()
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
  }

  private async loadLookupTextures() {
    const [area, search] = await Promise.all([fetchBytes(areaTexUrl), fetchBytes(searchTexUrl)])
    this.areaTex = this.createLookupTexture('SMAA AreaTex', 'rg8unorm', 160, 560, area)
    this.searchTex = this.createLookupTexture('SMAA SearchTex', 'r8unorm', 66, 33, search)
  }

  private createLookupTexture(name: string, format: GPUTextureFormat, width: number, height: number, data: Uint8Array) {
    const texture = this.device.createTexture({
      name,
      type: '2d',
      format,
      width,
      height,
      generateMipmap: false,
      mipLevelCount: 1,
    })
    const gpu = (this.device as WebGpuDevice).gpu
    gpu.queue.writeTexture(
      { texture: (texture as WebGpuTexture).gpuObject },
      data,
      { bytesPerRow: data.byteLength / height, rowsPerImage: height },
      { width, height },
    )
    return texture
  }
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

function createProgram(device: Device, name: string, source: string): Program {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}

function targetDesc(format: GPUTextureFormat): TextureDescriptor {
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
