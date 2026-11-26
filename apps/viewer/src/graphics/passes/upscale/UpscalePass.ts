import {
  BlendState,
  DepthState,
  SamplerState,
  TextureUsage,
  type Device,
  type Program,
  type Texture,
  type TextureDescriptor,
} from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { FSR1_EASU_WGSL, FSR1_RCAS_WGSL } from './Fsr1.wgsl'
import { UPSCALE_WGSL } from './UpscalePass.wgsl'

/**
 * Spatial upscalers of the final image, config `upscaler`
 */
export type UpscaleMode = 'fsr1' | 'bicubic' | 'bilinear'

/**
 * Upscales the final image (Color, render size) to the output size of the view ({@link RenderContext.outputWidth}),
 * after the post AA like the game's final UpscaleImage pass.
 *
 * @remarks
 * Writes a new version of `RenderChannel.Color` at the output size, so presenting and exporting stay the same. The
 * pass is skipped when the render size is not smaller than the output (native scale, supersampling of a fixed
 * resolution): then `Renderer.present` scales the image.
 *
 * Modes:
 * - `fsr1`: AMD FSR 1, EASU into an intermediate target, then RCAS sharpening ({@link UpscalePass.sharpness})
 * - `bicubic`: the B-spline of the game's final upscale
 * - `bilinear`: one bilinear tap
 */
export class UpscalePass implements RenderPass {
  public name = 'Upscale'
  public enabled = true
  public mode: UpscaleMode = 'fsr1'
  /**
   * RCAS sharpening of `fsr1` in stops: 0 is the strongest, each stop halves it (FsrRcasCon)
   */
  public sharpness = 0.2

  private programs: Partial<Record<'bilinear' | 'bicubic' | 'easu' | 'rcas', Program>> = {}
  private isActive = false
  private source: FrameResource
  private target: FrameResource
  // Float32Arrays: indexed writes, the gglib vec4() is an { x, y, z, w } object
  private easuCon = [new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4)]
  private easuSize = { inW: 0, inH: 0, outW: 0, outH: 0 }
  private rcasCon = new Float32Array(4)
  private easuDesc: TextureDescriptor = {
    type: '2d',
    format: 'rgba16float',
    width: 1,
    height: 1,
    depth: 1,
    mipLevelCount: 1,
    sampleCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
  private easuTarget: Texture | null = null

  public constructor(device: Device, options?: { mode?: UpscaleMode }) {
    this.mode = options?.mode ?? this.mode
    device.ready.then(() => {
      const create = (name: string, source: string, fragmentEntry: string) =>
        device.createShaderModule({ name, wgsl: { source, fragmentEntry } }).program.clone()
      this.programs.bilinear = create('Upscale bilinear', UPSCALE_WGSL, 'fs_bilinear')
      this.programs.bicubic = create('Upscale bicubic', UPSCALE_WGSL, 'fs_bicubic')
      this.programs.easu = create('FSR1 EASU', FSR1_EASU_WGSL, 'fs_easu')
      this.programs.rcas = create('FSR1 RCAS', FSR1_RCAS_WGSL, 'fs_rcas')
    })
  }

  private get isReady() {
    const p = this.programs
    if (this.mode === 'fsr1') {
      return !!p.easu?.isCompiled && !!p.rcas?.isCompiled
    }
    return !!p[this.mode]?.isCompiled
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    const upscales = ctx.viewWidth < ctx.outputWidth || ctx.viewHeight < ctx.outputHeight
    this.isActive = this.enabled && upscales && this.isReady
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(RenderChannel.Color, { width: ctx.outputWidth, height: ctx.outputHeight })
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const source = this.source.texture
    const target = this.target.texture
    const pass = ctx.device.renderPass
    pass.flush()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderBlend(0, BlendState.Opaque)

    if (this.mode !== 'fsr1') {
      const program = this.programs[this.mode]
      program.mustSet('source', source)
      program.mustSet('linearSampler', SamplerState.LinearClamp)
      this.draw(ctx, program, target)
      pass.flush()
      return
    }

    // EASU: render size → output size, into an intermediate target
    this.updateEasuConstants(source.width, source.height, target.width, target.height)
    this.easuDesc.width = target.width
    this.easuDesc.height = target.height
    this.easuTarget = ctx.resources.acquire(this.easuDesc, 'FSR1 EASU')
    const easu = this.programs.easu
    easu.set('easu.con0', this.easuCon[0])
    easu.set('easu.con1', this.easuCon[1])
    easu.set('easu.con2', this.easuCon[2])
    easu.set('easu.con3', this.easuCon[3])
    easu.mustSet('source', source)
    easu.mustSet('linearSampler', SamplerState.LinearClamp)
    this.draw(ctx, easu, this.easuTarget)

    // RCAS: sharpens into the Color target
    this.rcasCon[0] = Math.pow(2, -this.sharpness)
    const rcas = this.programs.rcas
    rcas.set('rcas.con', this.rcasCon)
    rcas.mustSet('source', this.easuTarget)
    this.draw(ctx, rcas, target)
    pass.flush()
    this.releaseTargets(ctx)
  }

  public cleanup(ctx: RenderContext): void {
    // released at the end of render, this only runs if the render threw
    this.releaseTargets(ctx)
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

  private releaseTargets(ctx: RenderContext) {
    if (this.easuTarget) {
      ctx.resources.release(this.easuTarget)
      this.easuTarget = null
    }
  }

  /**
   * FsrEasuCon, the input viewport is the whole input texture
   */
  private updateEasuConstants(inW: number, inH: number, outW: number, outH: number) {
    const s = this.easuSize
    if (s.inW === inW && s.inH === inH && s.outW === outW && s.outH === outH) {
      return
    }
    s.inW = inW
    s.inH = inH
    s.outW = outW
    s.outH = outH
    const [con0, con1, con2, con3] = this.easuCon
    // output pixel → input pixel, with the pixel center offset
    con0[0] = inW / outW
    con0[1] = inH / outH
    con0[2] = 0.5 * (inW / outW) - 0.5
    con0[3] = 0.5 * (inH / outH) - 0.5
    // texel → texture coordinate of the gather points (see the 12-tap layout in Fsr1.wgsl.ts)
    con1[0] = 1 / inW
    con1[1] = 1 / inH
    con1[2] = 1 / inW
    con1[3] = -1 / inH
    con2[0] = -1 / inW
    con2[1] = 2 / inH
    con2[2] = 1 / inW
    con2[3] = 2 / inH
    con3[0] = 0
    con3[1] = 4 / inH
    con3[2] = 0
    con3[3] = 0
  }
}
