import {
  SamplerState,
  TextureUsage,
  type Device,
  type GpuTimer,
  type Program,
  type Texture,
  type WebGpuDevice,
} from '@gglib/graphics'
import { mat4Multiply, vec4, type Mat4 } from '@gglib/math'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import {
  FROXEL_BLUR_H_WGSL,
  FROXEL_BLUR_V_WGSL,
  FROXEL_DEBUG_WGSL,
  FROXEL_DEPTH,
  FROXEL_INJECT_WGSL,
  FROXEL_MAX_DEPTH_WGSL,
  FROXEL_RAYMARCH_WGSL,
  FROXEL_REPROJECT_WGSL,
  FROXEL_TILE_SIZE,
  FROXEL_WORKGROUP_2D,
  FROXEL_WORKGROUP_3D,
  FroxelDebugModes,
  type FroxelDebugMode,
} from './FroxelFog.wgsl'

export interface FroxelFogPassOptions {
  /**
   * Linear view depth (full resolution), the far plane for the sky
   */
  linearDepth: RenderChannel
  /**
   * HDR color, only written by the debug views
   */
  color: RenderChannel
}

const STORAGE_USAGE = TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding
const VOLUME_USAGE = TextureUsage.TextureBinding | TextureUsage.StorageBinding
/**
 * Size of the random texture of the density noise (vfNoiseTex)
 */
const NOISE_SIZE = 64
/**
 * Weight of the history in the temporal reprojection (r_VolumetricFogReprojectionBlendFactor)
 */
const REPROJECTION_BLEND_FACTOR = 0.9
/**
 * NDC to texture coordinate scale-bias (m_pScaleBias of the game's PrevViewProjMatrix), column major
 */
const NDC_TO_TEXCOORD: Mat4 = new Float32Array([0.5, 0, 0, 0, 0, -0.5, 0, 0, 0, 0, 1, 0, 0.5, 0.5, 0, 1])

/**
 * Froxel volumetric fog: a view frustum aligned volume of
 * screen / {@link tileSize} × {@link slices} slices up to the time of day ray-marching range (the game uses 10 and 32,
 * see FROXEL_TILE_SIZE and FROXEL_DEPTH).
 *
 * Per frame: max depth per froxel column → injection of density and in-scattering at a jittered position (global
 * height fog, fog volumes, sun, global probe, lights) → blur H/V → temporal reprojection against the history →
 * front-to-back integration. The FogPass samples {@link integratedVolume}. The volume textures are owned by the pass
 * and persist across frames: two history volumes ping-pong, the horizontal blur target holds the integration.
 */
export class FroxelFogPass implements RenderPass {
  public name: string = 'Froxel Fog'
  public enabled = true
  public gpuTimer?: GpuTimer
  /**
   * Debug view over the color, see {@link FroxelDebugModes}, of the slice {@link debugSlice}
   */
  public debug: FroxelDebugMode = 'off'
  public debugSlice = 0
  /**
   * Screen pixels per froxel in x and y (r_VolumetricFogTexScale)
   */
  public tileSize = FROXEL_TILE_SIZE
  /**
   * Depth slices of the volume (r_VolumetricFogTexDepth)
   */
  public slices = FROXEL_DEPTH

  private options: FroxelFogPassOptions
  private maxDepthProgram: Program
  private injectProgram: Program
  private raymarchProgram: Program
  private blurHProgram: Program
  private blurVProgram: Program
  private reprojectProgram: Program
  private debugProgram: Program
  private depthInput: FrameResource
  private colorOutput: FrameResource | null = null
  private rendered = false
  private currentTile = FROXEL_TILE_SIZE
  private currentSlices = FROXEL_DEPTH

  private maxDepth: Texture | null = null
  private injected: Texture | null = null
  // target of the horizontal blur, then of the integration
  private integrated: Texture | null = null
  // reprojected volumes, written alternately: this frame's output is the next frame's history
  private history: [Texture | null, Texture | null] = [null, null]
  private historyIndex = 0
  private historyValid = false
  private noise: Texture | null = null
  private emptyVolume: Texture | null = null
  private publishEnabled = vec4(0)
  private publishDepth = vec4(0)
  private params = new Float32Array(32)
  private paramSize = this.params.subarray(0, 4)
  private paramDepth = this.params.subarray(4, 8)
  private paramDebug = this.params.subarray(8, 12)
  private paramTemporal = this.params.subarray(12, 16)
  private paramPrevViewProj = this.params.subarray(16, 32)

  public constructor(device: Device, options: FroxelFogPassOptions) {
    this.options = options
    device.ready.then(() => {
      this.maxDepthProgram = createProgram(device, 'Froxel Max Depth', FROXEL_MAX_DEPTH_WGSL)
      this.injectProgram = createProgram(device, 'Froxel Inject', FROXEL_INJECT_WGSL)
      this.raymarchProgram = createProgram(device, 'Froxel Raymarch', FROXEL_RAYMARCH_WGSL)
      this.blurHProgram = createProgram(device, 'Froxel Blur H', FROXEL_BLUR_H_WGSL)
      this.blurVProgram = createProgram(device, 'Froxel Blur V', FROXEL_BLUR_V_WGSL)
      this.reprojectProgram = createProgram(device, 'Froxel Reproject', FROXEL_REPROJECT_WGSL)
      this.debugProgram = createProgram(device, 'Froxel Debug', FROXEL_DEBUG_WGSL)
    })
  }

  private get isReady() {
    return (
      !!this.maxDepthProgram?.isCompiled &&
      !!this.injectProgram?.isCompiled &&
      !!this.raymarchProgram?.isCompiled &&
      !!this.blurHProgram?.isCompiled &&
      !!this.blurVProgram?.isCompiled &&
      !!this.reprojectProgram?.isCompiled &&
      !!this.debugProgram?.isCompiled
    )
  }

  /**
   * The integrated volume of this frame (rgb = in-scattering, a = transmittance up to each slice), null while the
   * pass is disabled or not ready
   */
  public get integratedVolume(): Texture | null {
    return this.enabled && this.rendered ? this.integrated : null
  }

  /**
   * Tile size and slices of the integrated volume (the settings of its last render)
   */
  public get volumeTileSize(): number {
    return this.currentTile
  }

  public get volumeSlices(): number {
    return this.currentSlices
  }

  /**
   * x = near, y = range - near, z = 1 / (slices - 1), w = 1 / (range - near) of the integrated volume
   */
  public get depthParams(): Float32Array {
    return this.paramDepth
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.rendered = false
    if (!this.enabled || !this.isReady) {
      // the history is stale once frames were skipped
      this.historyValid = false
      this.publish(ctx, null)
      return
    }
    frame.addPass(this)
    // the volume is owned by the pass, not a graph resource: without the debug output nothing would depend on it
    frame.keepAlive()
    this.depthInput = frame.read(this.options.linearDepth)
    this.colorOutput = this.debug !== 'off' ? frame.write(this.options.color, { usage: STORAGE_USAGE }) : null
  }

  public render(ctx: RenderContext): void {
    if (!this.isReady) {
      return
    }
    const device = ctx.device as WebGpuDevice
    this.currentTile = Math.max(2, Math.round(this.tileSize) || FROXEL_TILE_SIZE)
    this.currentSlices = Math.max(4, Math.round(this.slices) || FROXEL_DEPTH)
    const width = Math.ceil(ctx.viewWidth / this.currentTile)
    const height = Math.ceil(ctx.viewHeight / this.currentTile)
    this.ensureTargets(device, width, height, this.currentSlices)
    this.updateParams(ctx, width, height)
    // the froxel programs declare the global froxel volume as well, it must not be the volume they write
    this.publish(ctx, null)

    const pass = device.computePass
    if (this.gpuTimer) {
      pass.beginTimer(this.gpuTimer)
    }
    const inputs = ctx.renderInputs
    const blocks = inputs.blocks
    const groups3d = [
      Math.ceil(width / FROXEL_WORKGROUP_3D),
      Math.ceil(height / FROXEL_WORKGROUP_3D),
      Math.ceil(this.currentSlices / FROXEL_WORKGROUP_3D),
    ] as const
    const groups2d = [Math.ceil(width / FROXEL_WORKGROUP_2D), Math.ceil(height / FROXEL_WORKGROUP_2D)] as const

    // max depth per froxel column (StoreDownscaledMaxDepth)
    let program = this.maxDepthProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('linearDepth', this.depthInput.texture)
    program.mustSet('outMaxDepth', this.maxDepth)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups2d[0], groups2d[1])

    // density and in-scattering (InjectFogDensity + InjectVolumetricInscattering), the fog volumes and the
    // in-scattering constants come with the global block
    program = this.injectProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('maxDepthMap', this.maxDepth)
    program.mustSet('outVolume', this.injected)
    program.mustSet('noiseMap', this.noise)
    program.mustSet('noiseSampler', SamplerState.LinearWrap)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups3d[0], groups3d[1], groups3d[2])

    // blur against the jitter noise (BlurInscatterVolume): injected → integrated (as scratch) → injected
    program = this.blurHProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('source', this.injected)
    program.mustSet('outVolume', this.integrated)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups2d[0], groups2d[1], this.currentSlices)

    program = this.blurVProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('source', this.integrated)
    program.mustSet('outVolume', this.injected)
    program.mustSet('sourceSampler', SamplerState.LinearClamp)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups2d[0], groups2d[1], this.currentSlices)

    // temporal reprojection (ReprojectVolumetricFog): blurred + previous history → this frame's history
    const previous = this.history[this.historyIndex]
    const reprojected = this.history[1 - this.historyIndex]
    program = this.reprojectProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('current', this.injected)
    program.mustSet('previous', previous)
    program.mustSet('maxDepthMap', this.maxDepth)
    program.mustSet('outVolume', reprojected)
    program.mustSet('previousSampler', SamplerState.LinearClamp)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups3d[0], groups3d[1], groups3d[2])
    this.historyIndex = 1 - this.historyIndex
    this.historyValid = true

    // front-to-back integration (RaymarchVolumetricFog)
    program = this.raymarchProgram
    program.applyBlocks(blocks)
    this.setParams(program)
    program.mustSet('injected', reprojected)
    program.mustSet('outVolume', this.integrated)
    program.commit()
    pass.setProgram(program)
    pass.dispatch(groups2d[0], groups2d[1])

    if (this.colorOutput) {
      const color = this.colorOutput.texture
      program = this.debugProgram
      program.applyBlocks(blocks)
      this.setParams(program)
      program.mustSet('maxDepthMap', this.maxDepth)
      program.mustSet('injected', reprojected)
      program.mustSet('integrated', this.integrated)
      program.mustSet('outColor', color)
      program.commit()
      pass.setProgram(program)
      pass.dispatch(Math.ceil(color.width / FROXEL_WORKGROUP_2D), Math.ceil(color.height / FROXEL_WORKGROUP_2D))
    }
    if (this.gpuTimer) {
      pass.endTimer(this.gpuTimer)
    }
    pass.flush()
    this.rendered = true
    // transparent materials sample the volume in getSceneFog
    this.publish(ctx, this.integrated)
  }

  /**
   * Binds the integrated volume for the materials (global froxel inputs), or the empty volume and disables it
   */
  private publish(ctx: RenderContext, volume: Texture | null) {
    const inputs = ctx.renderInputs
    this.emptyVolume ??= createVolume(ctx.device, 'Froxel Empty', 1, 1, 1)
    this.publishEnabled.x = volume ? 1 : 0
    this.publishEnabled.y = this.currentSlices
    this.publishEnabled.z = this.currentTile
    this.publishDepth.x = this.paramDepth[0]
    this.publishDepth.y = this.paramDepth[1]
    this.publishDepth.z = this.paramDepth[2]
    this.publishDepth.w = this.paramDepth[3]
    inputs.set(InputSlots.Global.FroxelVolume, volume ?? this.emptyVolume)
    inputs.set(InputSlots.Global.FroxelDepth, this.publishDepth)
    inputs.set(InputSlots.Global.FroxelEnabled, this.publishEnabled)
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  public dispose() {
    this.disposeTargets()
    this.noise?.dispose()
    this.noise = null
    this.emptyVolume?.dispose()
    this.emptyVolume = null
  }

  private disposeTargets() {
    this.maxDepth?.dispose()
    this.injected?.dispose()
    this.integrated?.dispose()
    this.history[0]?.dispose()
    this.history[1]?.dispose()
    this.maxDepth = null
    this.injected = null
    this.integrated = null
    this.history[0] = null
    this.history[1] = null
    this.historyValid = false
  }

  private setParams(program: Program) {
    program.mustSet('froxel.size', this.paramSize)
    program.mustSet('froxel.depth', this.paramDepth)
    program.mustSet('froxel.debug', this.paramDebug)
    program.mustSet('froxel.temporal', this.paramTemporal)
    program.mustSet('froxel.prevViewProj', this.paramPrevViewProj)
  }

  private ensureTargets(device: Device, width: number, height: number, depth: number) {
    this.noise ??= createNoiseTexture(device)
    const v = this.integrated
    if (v?.width === width && v.height === height && v.depth === depth) {
      return
    }
    this.disposeTargets()
    this.maxDepth = device.createTexture({
      name: 'Froxel Max Depth',
      type: '2d',
      format: 'r32float',
      width,
      height,
      // storage views need a single mip
      mipLevelCount: 1,
      generateMipmap: false,
      usage: VOLUME_USAGE,
    })
    this.injected = createVolume(device, 'Froxel Injected', width, height, depth)
    this.integrated = createVolume(device, 'Froxel Integrated', width, height, depth)
    this.history[0] = createVolume(device, 'Froxel History 0', width, height, depth)
    this.history[1] = createVolume(device, 'Froxel History 1', width, height, depth)
    this.historyValid = false
  }

  /**
   * Bytes of the volume textures (max depth r32float, injected, integrated and 2 history volumes rgba16float)
   */
  public get memoryBytes(): number {
    const v = this.integrated
    if (!v) {
      return 0
    }
    return v.width * v.height * 4 + 4 * v.width * v.height * v.depth * 8
  }

  private updateParams(ctx: RenderContext, width: number, height: number) {
    const camera = ctx.view.camera
    // the ray-marching range of the time of day (sGetVolumetricFogDistanceParams.w), in VolFog2Zenith.z
    const zenith = ctx.renderInputs.get(InputSlots.Global.VolFog2Zenith) as any
    const range = Math.max(zenith?.z ?? zenith?.[2] ?? 64, camera.near + 0.0001)
    const near = camera.near
    const p = this.params
    p[0] = width
    p[1] = height
    p[2] = this.currentSlices
    p[3] = this.currentTile
    p[4] = near
    p[5] = range - near
    p[6] = 1 / (this.currentSlices - 1)
    p[7] = 1 / (range - near)
    p[8] = FroxelDebugModes.indexOf(this.debug)
    p[9] = Math.min(Math.max(Math.round(this.debugSlice), 0), this.currentSlices - 1)
    // no reprojection without a history (first frame, resize, after being disabled)
    p[12] = this.historyValid ? REPROJECTION_BLEND_FACTOR : 0
    // the view projection of the previous frame with the NDC to texture coordinate scale-bias applied
    // (CVolumetricFog::UpdateFrame); the history is only valid when this pass rendered that frame
    const prevViewProj = ctx.renderInputs.get(InputSlots.View.PreviousViewProjectionMatrix)
    if (prevViewProj) {
      mat4Multiply(NDC_TO_TEXCOORD, prevViewProj as Mat4, this.paramPrevViewProj)
    }
  }
}

function createProgram(device: Device, name: string, source: string): Program {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}

function createVolume(device: Device, name: string, width: number, height: number, depth: number): Texture {
  return device.createTexture({
    name,
    type: '3d',
    format: 'rgba16float',
    width,
    height,
    depth,
    mipLevelCount: 1,
    generateMipmap: false,
    usage: VOLUME_USAGE,
  })
}

/**
 * Random values for the density noise (vfNoiseTex, a 64² random texture in the game), from an integer hash so the
 * pattern is stable across sessions
 */
function createNoiseTexture(device: Device): Texture {
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4)
  for (let i = 0; i < NOISE_SIZE * NOISE_SIZE; i++) {
    let h = Math.imul(i + 1, 0x9e3779b1)
    h ^= h >>> 15
    h = Math.imul(h, 0x85ebca77)
    h ^= h >>> 13
    data[i * 4] = h & 0xff
    data[i * 4 + 1] = (h >>> 8) & 0xff
    data[i * 4 + 2] = (h >>> 16) & 0xff
    data[i * 4 + 3] = 255
  }
  return device.createTexture({
    name: 'Froxel Noise',
    type: '2d',
    format: 'rgba8unorm',
    width: NOISE_SIZE,
    height: NOISE_SIZE,
    mipLevelCount: 1,
    generateMipmap: false,
    source: data,
  })
}
