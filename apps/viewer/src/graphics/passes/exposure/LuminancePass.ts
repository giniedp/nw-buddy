import { BlendState, TextureUsage, type Device, type Program, type Texture } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import { LUMINANCE_ADAPT_WGSL, LUMINANCE_INITIAL_WGSL, LUMINANCE_REDUCE_WGSL } from './LuminancePass.wgsl'
import { vec4 } from '@gglib/math'

/**
 * Base color luminance the illuminance is estimated with. The game divides by the G-buffer albedo, which averages
 * to about 0.062 in a capture. 0.07 is the engine default without a G-buffer
 * (HDRSampleLumInitialPS, CLUSTER_FORWARD).
 */
const BASE_COLOR_LUMINANCE = 0.07
/**
 * r_HDREyeAdaptationSpeed, confirmed by the ElapsedTime constant of the capture
 */
const ADAPTATION_SPEED = 1
/**
 * Frames further apart than this snap to the measured luminance (first frame, level loads, stalls)
 */
const SNAP_SECONDS = 0.5
/**
 * Reduction chain after the 64x64 initial target, 4x4 texels per step
 */
const REDUCE_SIZES = [16, 4, 1]

/**
 * Measures the scene luminance and adapts it over time (MeasureLuminance and EyeAdaptation in D3DHDRRender.cpp).
 * The adapted luminance (x = luminance, y = illuminance) is read by the FilmMappingPass, which computes the exposure.
 *
 * Runs before bloom, like the game.
 */
export class LuminancePass implements RenderPass {
  public name = 'Luminance'
  public enabled = true

  private device: Device
  private initialProgram: Program
  private reduceProgram: Program
  private adaptProgram: Program
  private isActive = false
  private source: FrameResource

  private chain: Texture[] = []
  private adapted: Texture[] = []
  private adaptedIndex = 0
  private lastTime = -1
  private params = vec4()

  private get isReady() {
    return !!this.initialProgram?.isCompiled && !!this.reduceProgram?.isCompiled && !!this.adaptProgram?.isCompiled
  }

  /**
   * Adapted luminance written this frame, null while the pass is disabled or not ready
   */
  public get adaptedLuminance(): Texture | null {
    return this.isActive ? (this.adapted[this.adaptedIndex] ?? null) : null
  }

  public constructor(device: Device) {
    this.device = device
    device.ready.then(() => {
      this.initialProgram = createProgram(device, 'NW Luminance Initial', LUMINANCE_INITIAL_WGSL)
      this.reduceProgram = createProgram(device, 'NW Luminance Reduce', LUMINANCE_REDUCE_WGSL)
      this.adaptProgram = createProgram(device, 'NW Luminance Adapt', LUMINANCE_ADAPT_WGSL)
    })
  }

  /**
   * Reads the adapted luminance back, x = luminance, y = illuminance
   */
  public async read(): Promise<[number, number] | null> {
    const texture = this.adapted[this.adaptedIndex]
    if (!texture) {
      return null
    }
    const data = await texture.readPixelData(0, 0, 1, 1)
    const view = new DataView(data.buffer, data.byteOffset)
    return [halfToFloat(view.getUint16(0, true)), halfToFloat(view.getUint16(2, true))]
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    // measures once the film mapping runs (time of day values set)
    this.isActive = this.enabled && this.isReady && !!ctx.renderInputs.get(InputSlots.FilmMapping.FilmCurve)
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    // writes no channel, the result is read by the film mapping
    frame.keepAlive()
    this.source = frame.read(RenderChannel.Color)
    if (!this.chain.length) {
      this.chain = [64, ...REDUCE_SIZES].map((size) => createTarget(this.device, size))
      this.adapted = [createTarget(this.device, 1), createTarget(this.device, 1)]
    }
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const now = performance.now() / 1000
    const dt = this.lastTime < 0 ? Infinity : now - this.lastTime
    this.lastTime = now

    const pass = ctx.device.renderPass
    pass.flush()
    pass.setRenderBlend(0, BlendState.Opaque)
    this.params.x = BASE_COLOR_LUMINANCE

    this.params.z = 0
    this.draw(ctx, this.initialProgram, { sourceMap: this.source.texture }, this.chain[0])
    for (let i = 1; i < this.chain.length; i++) {
      this.params.z = i === this.chain.length - 1 ? 1 : 0
      this.draw(ctx, this.reduceProgram, { sourceMap: this.chain[i - 1] }, this.chain[i])
    }

    const previous = this.adapted[this.adaptedIndex]
    this.adaptedIndex = 1 - this.adaptedIndex
    const target = this.adapted[this.adaptedIndex]
    this.params.y = dt > SNAP_SECONDS ? 1 : 1 - Math.exp(-ADAPTATION_SPEED * dt)
    this.params.z = 0
    this.draw(ctx, this.adaptProgram, { previousMap: previous, currentMap: this.chain[this.chain.length - 1] }, target)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  private draw(ctx: RenderContext, program: Program, textures: Record<string, Texture>, target: Texture) {
    const pass = ctx.device.renderPass
    program.set('params.params', this.params)
    for (const key in textures) {
      program.mustSet(key, textures[key])
    }
    program.commit()
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
  }
}

function createProgram(device: Device, name: string, source: string) {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}

function halfToFloat(h: number) {
  const sign = h & 0x8000 ? -1 : 1
  const exponent = (h >> 10) & 0x1f
  const fraction = h & 0x3ff
  if (exponent === 0) {
    return sign * 2 ** -14 * (fraction / 1024)
  }
  if (exponent === 31) {
    return fraction ? NaN : sign * Infinity
  }
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024)
}

/**
 * 16 bit float like the game (R16G16_FLOAT), 32 bit float textures are not filterable and gglib binds float
 * textures as filterable
 */
function createTarget(device: Device, size: number) {
  return device.createRenderTarget({
    type: '2d',
    format: 'rgba16float',
    width: size,
    height: size,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  })
}
