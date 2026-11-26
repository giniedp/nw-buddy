import {
  BlendState,
  SamplerState,
  TextureUsage,
  type Device,
  type Program,
  type Texture,
  type TextureDescriptor,
} from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import { SUN_SHAFTS_APPLY_WGSL, SUN_SHAFTS_GEN_WGSL, SUN_SHAFTS_MASK_WGSL } from './SunShaftsPass.wgsl'

/**
 * `dst = src + dst * (1 - src)`, keeps destination alpha
 */
const APPLY_BLEND = BlendState.get({
  enable: true,
  colorBlendFunction: 'add',
  colorSrcBlend: 'one',
  colorDstBlend: 'one-minus-src',
  alphaBlendFunction: 'add',
  alphaSrcBlend: 'zero',
  alphaDstBlend: 'one',
})

/**
 * Sun is skipped when it is behind the camera (CSunShafts::IsVisible, fSunVisThreshold)
 */
const SUN_VISIBILITY_THRESHOLD = 0.25

/**
 * Per pixel jitter of the first blur pass in steps, hides the banding of its large steps (not in the original)
 */
const SHAFTS_JITTER = 1

/**
 * Sun shafts post process, port of CSunShafts (PostProcessSunShafts.cpp, SunShafts.cfx).
 *
 * - {@link generate}: mask from the HDR scene and depth at half resolution, then two radial blur passes
 *   towards the sun (CSunShafts::SunShaftsGen). Must run before tone mapping.
 * - {@link apply}: blends the shafts into the tone mapped image (ApplyMergedProcesses of the HDR final pass).
 *   Must run after tone mapping.
 *
 * Parameters come from the time of day, see {@link InputSlots.SunShafts}.
 * Not implemented: the occlusion query (r_sunshafts 2) and the deprecated SunShaftsDisplay path.
 */
export class SunShaftsPass {
  public enabled = true

  public readonly generate: RenderPass
  public readonly apply: RenderPass

  private maskProgram: Program
  private genProgram: Program
  private applyProgram: Program

  private isActive = false
  private source: FrameResource
  private depth: FrameResource
  private target: FrameResource

  private texDesc: TextureDescriptor
  private texShafts: Texture
  private texPingPong: Texture

  private sunPos = new Float32Array(4)
  private shafts = new Float32Array(4)
  private screen = new Float32Array(4)
  private color = new Float32Array(4)

  private get isReady() {
    return !!this.maskProgram?.isCompiled && !!this.genProgram?.isCompiled && !!this.applyProgram?.isCompiled
  }

  public constructor(device: Device) {
    device.ready.then(() => {
      this.maskProgram = createProgram(device, 'NW Sun Shafts Mask', SUN_SHAFTS_MASK_WGSL)
      this.genProgram = createProgram(device, 'NW Sun Shafts Gen', SUN_SHAFTS_GEN_WGSL)
      this.applyProgram = createProgram(device, 'NW Sun Shafts Apply', SUN_SHAFTS_APPLY_WGSL)
    })
    this.generate = {
      name: 'Sun Shafts',
      setup: (frame, ctx) => this.setupGenerate(frame, ctx),
      render: (ctx) => this.renderGenerate(ctx),
      cleanup: () => {},
    }
    this.apply = {
      name: 'Sun Shafts Apply',
      setup: (frame, ctx) => this.setupApply(frame, ctx),
      render: (ctx) => this.renderApply(ctx),
      cleanup: (ctx) => this.releaseTextures(ctx),
    }
  }

  private setupGenerate(frame: FrameGraph<RenderPass>, ctx: RenderContext) {
    this.isActive = this.enabled && this.isReady && this.updateParams(ctx)
    if (!this.isActive) {
      return
    }
    frame.addPass(this.generate)
    // writes no channel, the result is used by the apply pass
    frame.keepAlive()
    this.source = frame.read(RenderChannel.Color)
    this.depth = frame.read(RenderChannel.LinearDepth)

    // 8 bit like BackBufferScaled_d2 in the game (R8G8B8A8_UNORM in GPA captures): the mask and both blur passes
    // are clamped to [0, 1]. A float target lets the HDR brightness around the sun accumulate and white out the image.
    this.texDesc ||= {
      type: '2d',
      format: 'rgba8unorm',
      width: 1,
      height: 1,
      depth: 1,
      mipLevelCount: 1,
      sampleCount: 1,
      usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
    }
    // half resolution (BackBufferScaled_d2, high quality)
    this.texDesc.width = Math.max(1, Math.ceil(ctx.viewWidth / 2))
    this.texDesc.height = Math.max(1, Math.ceil(ctx.viewHeight / 2))
    this.texShafts ||= ctx.resources.acquire(this.texDesc, 'Sun Shafts')
    this.texPingPong ||= ctx.resources.acquire(this.texDesc, 'Sun Shafts Ping Pong')
  }

  private setupApply(frame: FrameGraph<RenderPass>, ctx: RenderContext) {
    if (!this.isActive) {
      return
    }
    frame.addPass(this.apply)
    this.target = frame.modifyInPlace(RenderChannel.Color)
  }

  private renderGenerate(ctx: RenderContext) {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    pass.flush()
    pass.setRenderBlend(0, BlendState.Opaque)

    // mask
    {
      const program = this.maskProgram
      this.setParams(program)
      program.mustSet('colorMap', this.source.texture)
      program.mustSet('depthMap', this.depth.texture)
      this.draw(ctx, program, this.texShafts)
    }

    // big radius, project until end of screen. Jittered, the second pass smooths the noise.
    this.shafts[0] = 0.1
    this.shafts[2] = SHAFTS_JITTER
    this.blur(ctx, this.texShafts, this.texPingPong)
    // interpolate between projections
    this.shafts[0] = 0.025
    this.shafts[2] = 0
    this.blur(ctx, this.texPingPong, this.texShafts)
    pass.flush()
  }

  private renderApply(ctx: RenderContext) {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    pass.flush()
    const program = this.applyProgram
    this.setParams(program)
    program.mustSet('shaftsMap', this.texShafts)
    program.set('shaftsSampler', SamplerState.LinearClamp)
    pass.setRenderBlend(0, APPLY_BLEND)
    this.draw(ctx, program, this.target.texture)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.flush()
  }

  private blur(ctx: RenderContext, source: Texture, target: Texture) {
    const program = this.genProgram
    this.setParams(program)
    program.mustSet('maskMap', source)
    program.set('maskSampler', SamplerState.LinearClamp)
    this.draw(ctx, program, target)
  }

  private draw(ctx: RenderContext, program: Program, target: Texture) {
    const pass = ctx.device.renderPass
    program.commit()
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
  }

  private setParams(program: Program) {
    program.set('params.sunPos', this.sunPos)
    program.set('params.shafts', this.shafts)
    program.set('params.screen', this.screen)
    program.set('params.color', this.color)
  }

  /**
   * Returns false when the shafts are inactive or the sun is behind the camera
   */
  private updateParams(ctx: RenderContext): boolean {
    const inputs = ctx.renderInputs
    const params = inputs.get(InputSlots.SunShafts.Params)
    const color = inputs.get(InputSlots.SunShafts.Color)
    const sunDirection = inputs.get(InputSlots.Global.SunDirection)
    if (!params || !color || !sunDirection || !params.x) {
      return false
    }

    const camera = ctx.view.camera
    // direction towards the sun, global sun direction points away from it
    const dx = -sunDirection.x
    const dy = -sunDirection.y
    const dz = -sunDirection.z
    const len = Math.hypot(dx, dy, dz) || 1

    // project the direction (w = 0), sun at infinity
    const view = camera.view
    const vx = view[0] * dx + view[4] * dy + view[8] * dz
    const vy = view[1] * dx + view[5] * dy + view[9] * dz
    const vz = view[2] * dx + view[6] * dy + view[10] * dz
    // sun direction dot camera forward (-z in view space)
    const fSign = -vz / len
    if (fSign < -SUN_VISIBILITY_THRESHOLD) {
      return false
    }
    const proj = camera.projection
    const cx = proj[0] * vx + proj[4] * vy + proj[8] * vz
    const cy = proj[1] * vx + proj[5] * vy + proj[9] * vz
    const cw = proj[3] * vx + proj[7] * vy + proj[11] * vz
    this.sunPos[0] = ((cx + cw) * 0.5) / (1e-6 + cw)
    this.sunPos[1] = ((-cy + cw) * 0.5) / (1e-6 + cw)
    this.sunPos[2] = 0
    this.sunPos[3] = fSign

    this.shafts[0] = 0.1
    this.shafts[1] = params.y

    this.screen[0] = 1 / camera.far
    this.screen[1] = (1.333 * ctx.viewHeight) / ctx.viewWidth
    this.screen[2] = ctx.viewWidth
    this.screen[3] = ctx.viewHeight

    this.color[0] = color.x
    this.color[1] = color.y
    this.color[2] = color.z
    this.color[3] = 1
    return true
  }

  private releaseTextures(ctx: RenderContext) {
    if (this.texShafts) {
      ctx.resources.release(this.texShafts)
      this.texShafts = null
    }
    if (this.texPingPong) {
      ctx.resources.release(this.texPingPong)
      this.texPingPong = null
    }
  }
}

function createProgram(device: Device, name: string, source: string) {
  return device.createShaderModule({ name, wgsl: { source } }).program.clone()
}
