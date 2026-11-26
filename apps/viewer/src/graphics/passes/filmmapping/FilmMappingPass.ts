import { SamplerState, TextureUsage, type Device, type Program, type Texture } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import { NwBloomChannel } from '../bloom/BloomPass'
import type { LuminancePass } from '../exposure/LuminancePass'
import { FILM_MAPPING_WGSL } from './FilmMappingPass.wgsl'

/**
 * Tone mapping of the game: exposure, saturation, color balance and the film curve from the time of day.
 *
 * @remarks
 * Runs once the time of day values are set (SkyLightSystem), the HDR color passes unchanged before.
 *
 * Exposure comes from the adapted luminance of the {@link LuminancePass} (EV mode of the game), or the constant
 * {@link InputSlots.FilmMapping.Exposure} with the `exposure: fixed` config.
 */
export class FilmMappingPass implements RenderPass {
  public name = 'Film Mapping'
  public enabled = true

  private program: Program
  private isActive = false
  private source: FrameResource
  private target: FrameResource
  /**
   * Multiplies the output color by the scene alpha, for a transparent canvas (premultiplied alpha): pixels without
   * geometry (alpha 0) stay empty, also where fog or bloom added color. Off, the output is opaque.
   */
  public premultiplyAlpha: boolean
  /**
   * Exposes pixels without geometry (alpha 0, e.g. a sky drawn with alpha 0) with the adapted luminance while the
   * exposure is fixed
   */
  public backgroundAdaptedExposure = false

  private eyeAdaptation = new Float32Array(4)
  private exposure = new Float32Array(4)
  private output = new Float32Array(4)
  private bloom: FrameResource | null = null
  private fallback1x1: Texture

  private luminance: LuminancePass | null

  /**
   * @param luminance - source of the adapted luminance, fixed exposure while it is missing or disabled
   * @param premultiplyAlpha - initial {@link premultiplyAlpha}
   */
  public constructor(device: Device, luminance: LuminancePass | null, premultiplyAlpha = false) {
    this.luminance = luminance
    this.premultiplyAlpha = premultiplyAlpha
    device.ready.then(() => {
      this.program = device
        .createShaderModule({ name: 'NW Film Mapping', wgsl: { source: FILM_MAPPING_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    const inputs = ctx.renderInputs
    this.isActive = this.enabled && !!this.program?.isCompiled && !!inputs.get(InputSlots.FilmMapping.FilmCurve)
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    // the bloom pass declares its output only once its shaders are compiled (or while it is enabled)
    this.bloom = frame.has(NwBloomChannel.Bloom) ? frame.read(NwBloomChannel.Bloom) : null
    this.target = frame.write(RenderChannel.Color)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const inputs = ctx.renderInputs
    const program = this.program
    const target = this.target.texture
    program.set('params.colorBalance', inputs.get(InputSlots.FilmMapping.ColorBalance))
    program.set('params.filmCurve', inputs.get(InputSlots.FilmMapping.FilmCurve))
    const exposure = inputs.get(InputSlots.FilmMapping.Exposure)
    this.exposure[0] = exposure?.x ?? 1
    this.exposure[1] = this.bloom ? ((inputs.get(InputSlots.FilmMapping.Bloom) as number | undefined) ?? 0) : 0
    program.set('params.exposure', this.exposure)
    const lumMap = this.luminance?.adaptedLuminance
    const eye = inputs.get(InputSlots.FilmMapping.EyeAdaptation)
    // fixed exposure until the luminance pass has produced a value
    this.eyeAdaptation[0] = eye?.x ?? 0
    this.eyeAdaptation[1] = eye?.y ?? 0
    this.eyeAdaptation[2] = eye?.z ?? 0
    this.eyeAdaptation[3] = lumMap && eye?.w ? 1 : 0
    program.set('params.eyeAdaptation', this.eyeAdaptation)
    this.output[0] = this.premultiplyAlpha ? 1 : 0
    this.output[1] = lumMap && this.backgroundAdaptedExposure ? 1 : 0
    program.set('params.output', this.output)
    program.mustSet('lumMap', lumMap ?? this.fallbackLumMap(ctx))
    program.mustSet('sourceMap', this.source.texture)
    // without bloom any texture is bound, the blend factor is 0
    program.mustSet('bloomMap', this.bloom?.texture ?? this.fallbackLumMap(ctx))
    program.mustSet('bloomSampler', SamplerState.LinearClamp)
    program.commit()

    const pass = ctx.device.renderPass
    pass.flush()
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
    pass.flush()
  }

  private fallbackLumMap(ctx: RenderContext): Texture {
    this.fallback1x1 ||= ctx.device.createRenderTarget({
      type: '2d',
      format: 'rgba16float',
      width: 1,
      height: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    })
    return this.fallback1x1
  }

  public cleanup(ctx: RenderContext): void {}
}
