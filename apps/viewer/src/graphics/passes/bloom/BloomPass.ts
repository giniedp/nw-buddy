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
import {
  FrameGraph,
  renderChannel,
  RenderChannel,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import { BLOOM_DOWNSAMPLE_WGSL, BLOOM_GAUSSIAN_WGSL } from './BloomPass.wgsl'

export const NwBloomChannel = {
  /**
   * Quarter resolution bloom (the game's HDRFinalBloom), blended in by the film mapping
   */
  Bloom: renderChannel('nw_bloom'),
}

// sum of Gaussians 0.0174 * G(0.008, r) + 0.192 * G(0.0576, r) (CHDRPostProcess::BloomGeneration)
const SIGMA1 = Math.sqrt(0.008)
const SIGMA2 = Math.sqrt(0.0576 - 0.008)

function scratchDescriptor(width: number, height: number): TextureDescriptor {
  return {
    type: '2d',
    format: 'rgba16float',
    width,
    height,
    depth: 1,
    mipLevelCount: 1,
    sampleCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
}

/**
 * Bloom of the game (CHDRPostProcess, r_HDRBloomQuality 2) into {@link NwBloomChannel.Bloom}:
 * 1. HDR color → half resolution, DownsampleStable with kill fireflies
 * 2. half → quarter resolution, DownsampleStable
 * 3. two separable 15 tap binomial blurs at quarter resolution (steps 1/400 and 1/225 of the screen, the second
 *    wider by sigma2 / sigma1), composed as a sum of Gaussians
 *
 * No threshold: the film mapping blends the whole result in by the time of day bloom amount
 * (`lerp(scene, bloom, HDRBloomColor)`).
 */
export class BloomPass implements RenderPass {
  public name: string = 'Bloom'
  public enabled = true

  private downsample: Program[] = []
  private gaussian: Program[] = []
  private isActive = false
  private source: FrameResource
  private target: FrameResource
  private halfDesc = scratchDescriptor(1, 1)
  private quarterDesc = scratchDescriptor(1, 1)
  private downParams = [new Float32Array([1, 0, 0, 0]), new Float32Array([0, 0, 0, 0])]
  private gaussParams = [new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4)]

  public constructor(device: Device) {
    device.ready.then(() => {
      const down = device.createShaderModule({ name: 'NW Bloom Downsample', wgsl: { source: BLOOM_DOWNSAMPLE_WGSL } })
      const gauss = device.createShaderModule({ name: 'NW Bloom Gaussian', wgsl: { source: BLOOM_GAUSSIAN_WGSL } })
      // one program per draw, each keeps its own parameters
      this.downsample = [down.program.clone(), down.program.clone()]
      this.gaussian = [gauss.program.clone(), gauss.program.clone(), gauss.program.clone(), gauss.program.clone()]
    })
  }

  private get isReady() {
    return (
      this.downsample.length > 0 &&
      this.downsample.every((it) => it.isCompiled) &&
      this.gaussian.every((it) => it.isCompiled)
    )
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && this.isReady
    if (!this.isActive) {
      return
    }
    const halfW = Math.max(1, Math.ceil(ctx.viewWidth / 2))
    const halfH = Math.max(1, Math.ceil(ctx.viewHeight / 2))
    const quarterW = Math.max(1, Math.ceil(halfW / 2))
    const quarterH = Math.max(1, Math.ceil(halfH / 2))
    this.halfDesc.width = halfW
    this.halfDesc.height = halfH
    this.quarterDesc.width = quarterW
    this.quarterDesc.height = quarterH
    // explicit sizes (the frame graph scales only the width of fractional descriptors)
    frame.setDescriptors({ [NwBloomChannel.Bloom]: this.quarterDesc })
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(NwBloomChannel.Bloom)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const half = ctx.resources.acquire(this.halfDesc, 'Bloom Half')
    const quarter = ctx.resources.acquire(this.quarterDesc, 'Bloom Quarter')
    const temp1 = ctx.resources.acquire(this.quarterDesc, 'Bloom Temp 1')
    const temp0 = ctx.resources.acquire(this.quarterDesc, 'Bloom Temp 0')
    const output = this.target.texture

    const pass = ctx.device.renderPass
    pass.flush()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderBlend(0, BlendState.Opaque)

    this.drawDownsample(ctx, 0, this.source.texture, half)
    this.drawDownsample(ctx, 1, half, quarter)

    // CHDRPostProcess::BloomGeneration: steps of 1/400 and 1/225 of the screen
    const stepW = 1 / 400
    const stepH = 1 / 225
    const ratio = SIGMA2 / SIGMA1
    this.drawGaussian(ctx, 0, quarter, null, temp1, stepW, 0)
    this.drawGaussian(ctx, 1, temp1, null, temp0, 0, stepH)
    this.drawGaussian(ctx, 2, temp0, null, temp1, ratio * stepW, 0)
    this.drawGaussian(ctx, 3, temp1, temp0, output, 0, ratio * stepH)

    pass.setRenderTarget(0, null)
    pass.flush()
    ctx.resources.release(half)
    ctx.resources.release(quarter)
    ctx.resources.release(temp1)
    ctx.resources.release(temp0)
  }

  private drawDownsample(ctx: RenderContext, index: number, source: Texture, target: Texture) {
    const program = this.downsample[index]
    program.mustSet('params.values', this.downParams[index])
    program.mustSet('source', source)
    program.mustSet('sourceSampler', SamplerState.LinearClamp)
    program.commit()
    this.draw(ctx, program, target)
  }

  private drawGaussian(
    ctx: RenderContext,
    index: number,
    source: Texture,
    bloom0: Texture | null,
    target: Texture,
    stepX: number,
    stepY: number,
  ) {
    const params = this.gaussParams[index]
    params[0] = stepX
    params[1] = stepY
    params[2] = bloom0 ? 1 : 0
    const program = this.gaussian[index]
    program.mustSet('params.values', params)
    program.mustSet('source', source)
    // without the composition any texture is bound, the shader does not read it
    program.mustSet('bloomMap', bloom0 ?? source)
    program.mustSet('sourceSampler', SamplerState.LinearClamp)
    program.commit()
    this.draw(ctx, program, target)
  }

  private draw(ctx: RenderContext, program: Program, target: Texture) {
    const pass = ctx.device.renderPass
    pass.setRenderTarget(0, target)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
