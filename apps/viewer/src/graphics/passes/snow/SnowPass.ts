import {
  BlendState,
  CullState,
  DepthState,
  SamplerState,
  StencilState,
  TextureUsage,
  type Device,
  type Program,
  type Texture,
  type TextureDescriptor,
} from '@gglib/graphics'
import { mat4Invert, mat4Multiply, type IVec4, type Mat4 } from '@gglib/math'
import {
  FrameGraph,
  renderChannel,
  RenderChannel,
  type FrameResource,
  type RenderContext,
  type RenderPass,
} from '@gglib/render'
import {
  Noise3DKey,
  SnowArealNoiseKey,
  SnowDerivativesKey,
  SnowFrostBubblesKey,
  SnowFrostBumpKey,
  SnowSpatterKey,
} from '../../../content'
import { InputSlots } from '../../../material/common'
import { SNOW_COPY_WGSL, SNOW_WGSL, SnowDebugModes, type SnowDebugMode } from './SnowPass.wgsl'

/**
 * Copies of GBuffer A/B/C, the inputs of the snow layer (WebGPU can't sample the targets it renders into)
 */
export const SnowChannel = {
  A: renderChannel('nw_snow_gbuffer_a'),
  B: renderChannel('nw_snow_gbuffer_b'),
  C: renderChannel('nw_snow_gbuffer_c'),
}

function copyDescriptor(name: string, format: TextureDescriptor['format']): Readonly<TextureDescriptor> {
  return {
    name,
    type: '2d',
    format,
    width: 1,
    height: 1,
    depth: 1,
    sampleCount: 1,
    mipLevelCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
}

// formats of the GBuffer channels (GBufferChannels.ts)
const COPY_DESCRIPTORS: Record<RenderChannel, Readonly<TextureDescriptor>> = {
  [SnowChannel.A]: copyDescriptor('SnowChannel.A', 'rgb10a2unorm'),
  [SnowChannel.B]: copyDescriptor('SnowChannel.B', 'rgba8unorm'),
  [SnowChannel.C]: copyDescriptor('SnowChannel.C', 'rgba8unorm'),
}

const DEPTH_ALWAYS = DepthState.get({ enabled: true, depthFunction: 'always', depthWriteEnabled: false })

/**
 * Engine textures loaded by the ContentService, in the order of the shader bindings
 */
const ENGINE_TEXTURE_KEYS = [
  SnowArealNoiseKey,
  SnowDerivativesKey,
  SnowSpatterKey,
  SnowFrostBumpKey,
  SnowFrostBubblesKey,
  Noise3DKey,
]

export interface SnowPassOptions {
  a: RenderChannel
  b: RenderChannel
  c: RenderChannel
  /**
   * Linear view depth of the GBuffer pass
   */
  linearDepth: RenderChannel
  /**
   * The stencil bit of the snow receivers, written by the GBuffer pass
   */
  stencilBit: number
}

/**
 * Deferred snow layer (FX_DeferredSnowLayer), after the projected decals, before AO and
 * lighting. Copies GBuffer A/B/C, then rewrites them on the snow receivers (stencil) inside the screen rect of the
 * snow sphere (scissor), decoded, modified and encoded without blending. Skipped while the SnowSystem publishes no
 * active volume (global snowVolumeParams.w = 0).
 */
export class SnowPass implements RenderPass {
  public name: string = 'Snow'
  public enabled = true
  public debug: SnowDebugMode = 'off'

  private options: SnowPassOptions
  private device: Device
  private copyProgram: Program
  private program: Program
  private stencil: StencilState
  private isActive = false
  private targets: FrameResource[] = []
  private copies: FrameResource[] = []
  private linearDepth: FrameResource
  private depth: FrameResource
  private params = new Float32Array(4)
  private camera = new Float32Array(4)
  private viewport = new Float32Array(4)
  private viewProjection = new Float32Array(16) as unknown as Mat4
  private inverseViewProjection = new Float32Array(16) as unknown as Mat4
  private textures: Texture[] | null = null
  private scissor = new Int32Array(4)

  public constructor(device: Device, options: SnowPassOptions) {
    this.options = options
    this.device = device
    this.stencil = StencilState.get({
      enable: true,
      readMask: options.stencilBit,
      writeMask: 0,
      frontFunction: 'equal',
      backFunction: 'equal',
    })
    device.ready.then(() => {
      this.copyProgram = device
        .createShaderModule({ name: 'NW Snow Copy', wgsl: { source: SNOW_COPY_WGSL } })
        .program.clone()
      this.program = device.createShaderModule({ name: 'NW Snow', wgsl: { source: SNOW_WGSL } }).program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    const volume = ctx.renderInputs.get(InputSlots.Global.SnowVolumeParams) as IVec4 | undefined
    this.isActive =
      this.enabled &&
      !!volume?.w &&
      !!this.copyProgram?.isCompiled &&
      !!this.program?.isCompiled &&
      this.acquireTextures() &&
      this.computeScissor(ctx, volume)
    if (!this.isActive) {
      return
    }
    frame.setDescriptors(COPY_DESCRIPTORS)
    frame.addPass(this)
    const { a, b, c, linearDepth } = this.options
    this.targets = [frame.modifyInPlace(a), frame.modifyInPlace(b), frame.modifyInPlace(c)]
    this.copies = [frame.write(SnowChannel.A), frame.write(SnowChannel.B), frame.write(SnowChannel.C)]
    this.linearDepth = frame.read(linearDepth)
    this.depth = frame.read(RenderChannel.Depth)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    const [a, b, c] = this.targets
    const [x, y, w, h] = this.scissor
    pass.flush()

    // 1. copy the snow rect of A/B/C
    const copy = this.copyProgram
    copy.mustSet('sourceA', a.texture)
    copy.mustSet('sourceB', b.texture)
    copy.mustSet('sourceC', c.texture)
    copy.commit()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setCullState(CullState.Disabled)
    for (let i = 0; i < 3; i++) {
      pass.setRenderTarget(i, this.copies[i].texture)
      pass.setRenderBlend(i, BlendState.Opaque)
    }
    pass.setViewportState(0, 0, a.texture.width, a.texture.height)
    pass.setScissorState(x, y, w, h)
    pass.setProgram(copy)
    pass.draw(3)
    pass.submit()

    // 2. snow on the receivers, written unblended into A/B/C
    const program = this.program
    const [ta, tb, tc] = this.copies
    const [arealNoise, derivatives, spatter, frostBump, frostBubbles, noise3d] = this.textures
    const camera = ctx.view.camera
    const inputs = ctx.renderInputs
    mat4Multiply(camera.projection, camera.view, this.viewProjection)
    mat4Invert(this.viewProjection, this.inverseViewProjection)
    this.camera[0] = camera.world[12]
    this.camera[1] = camera.world[13]
    this.camera[2] = camera.world[14]
    this.camera[3] = camera.far
    this.viewport[0] = a.texture.width
    this.viewport[1] = a.texture.height
    this.params[0] = SnowDebugModes.indexOf(this.debug)
    this.params[1] = (inputs.get(InputSlots.Global.OceanLevel) as number | undefined) ?? -10000
    program.mustSet('params.inverseViewProjection', this.inverseViewProjection)
    program.mustSet('params.camera', this.camera)
    program.mustSet('params.viewport', this.viewport)
    program.mustSet('params.volume', inputs.get(InputSlots.Global.SnowVolumeParams))
    program.mustSet('params.multipliers', inputs.get(InputSlots.Global.SnowMultipliers))
    program.mustSet('params.brightness', inputs.get(InputSlots.Global.SnowBrightness))
    program.mustSet('params.values', this.params)
    program.mustSet('gbufferA', ta.texture)
    program.mustSet('gbufferB', tb.texture)
    program.mustSet('gbufferC', tc.texture)
    program.mustSet('linearDepth', this.linearDepth.texture)
    program.mustSet('snowSampler', SamplerState.LinearWrap)
    program.mustSet('arealNoiseMap', arealNoise)
    program.mustSet('derivativesMap', derivatives)
    program.mustSet('spatterMap', spatter)
    program.mustSet('frostBumpMap', frostBump)
    program.mustSet('frostBubblesMap', frostBubbles)
    program.mustSet('volumeNoiseMap', noise3d)
    program.commit()
    for (let i = 0; i < 3; i++) {
      pass.setRenderTarget(i, this.targets[i].texture)
    }
    pass.setDepthTarget(this.depth.texture)
    // a depth-stencil attachment needs a depth compare, this one always passes and never writes
    pass.setDepthState(DEPTH_ALWAYS)
    pass.setStencilState(this.stencil)
    pass.setStencilReference(this.options.stencilBit)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()

    pass.setStencilState(StencilState.Default)
    pass.setStencilReference(0)
    pass.setDepthState(DepthState.Disabled)
    pass.setDepthTarget(null)
    pass.setScissorState(null)
    for (let i = 0; i < 3; i++) {
      pass.setRenderTarget(i, null)
    }
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  private acquireTextures(): boolean {
    if (this.textures) {
      return true
    }
    // throws until the ContentService has loaded them (without throwIfMissing the device would create an empty
    // texture under the key)
    try {
      this.textures = ENGINE_TEXTURE_KEYS.map((key) => this.device.acquireTexture({ key, throwIfMissing: true }))
      return true
    } catch {
      return false
    }
  }

  /**
   * Screen rect of the snow sphere (CDeferredShading::GetScissors) in render pixels, false when it is off screen.
   * The whole view when the camera is inside the sphere's bounding box or a corner is behind the camera.
   */
  private computeScissor(ctx: RenderContext, volume: IVec4): boolean {
    const width = ctx.viewWidth
    const height = ctx.viewHeight
    const out = this.scissor
    out[0] = 0
    out[1] = 0
    out[2] = width
    out[3] = height
    const { view, projection, near } = ctx.view.camera
    const r = 1 / volume.w
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < 8; i++) {
      const px = volume.x + (i & 1 ? r : -r)
      const py = volume.y + (i & 2 ? r : -r)
      const pz = volume.z + (i & 4 ? r : -r)
      // view space
      const vx = view[0] * px + view[4] * py + view[8] * pz + view[12]
      const vy = view[1] * px + view[5] * py + view[9] * pz + view[13]
      const vz = view[2] * px + view[6] * py + view[10] * pz + view[14]
      // clip space
      const cx = projection[0] * vx + projection[4] * vy + projection[8] * vz + projection[12]
      const cy = projection[1] * vx + projection[5] * vy + projection[9] * vz + projection[13]
      const cw = projection[3] * vx + projection[7] * vy + projection[11] * vz + projection[15]
      if (cw <= near) {
        return true
      }
      const nx = cx / cw
      const ny = cy / cw
      minX = Math.min(minX, nx)
      maxX = Math.max(maxX, nx)
      minY = Math.min(minY, ny)
      maxY = Math.max(maxY, ny)
    }
    if (maxX < -1 || minX > 1 || maxY < -1 || minY > 1) {
      return false
    }
    const x0 = Math.floor((Math.max(minX, -1) * 0.5 + 0.5) * width)
    const x1 = Math.ceil((Math.min(maxX, 1) * 0.5 + 0.5) * width)
    // ndc y up, pixels y down
    const y0 = Math.floor((0.5 - Math.min(maxY, 1) * 0.5) * height)
    const y1 = Math.ceil((0.5 - Math.max(minY, -1) * 0.5) * height)
    out[0] = x0
    out[1] = y0
    out[2] = Math.max(1, x1 - x0)
    out[3] = Math.max(1, y1 - y0)
    return true
  }
}
