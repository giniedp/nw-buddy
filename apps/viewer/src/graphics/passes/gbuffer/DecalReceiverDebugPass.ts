import { BlendState, CullState, DepthState, StencilState, type Device, type Program } from '@gglib/graphics'
import { RenderChannel, type FrameGraph, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'

const TINT_WGSL = /* wgsl */ `
@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(p[i], 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4f {
  return vec4f(0.0, 1.0, 0.2, 0.45);
}
`

const DEPTH_ALWAYS = DepthState.get({ enabled: true, depthFunction: 'always', depthWriteEnabled: false })

export interface DecalReceiverDebugPassOptions {
  enabled?: boolean
  /**
   * Pass name, defaults to 'Decal Receivers'
   */
  name?: string
  /**
   * The stencil bit of the receivers
   */
  stencilBit: number
}

/**
 * Debug view of a receiver stencil bit (plan 7.4): tints the final image where the GBuffer pass wrote the bit, e.g.
 * the decal receivers (terrain, meshes with acceptDecals) or the snow receivers (terrain, meshes with acceptSnow).
 * Tests the stencil of `Depth`, reads no texture.
 */
export class DecalReceiverDebugPass implements RenderPass {
  public readonly name: string
  public enabled = false

  private program: Program
  private stencil: StencilState
  private stencilBit: number
  private color: FrameResource
  private depth: FrameResource

  public constructor(device: Device, options: DecalReceiverDebugPassOptions) {
    this.name = options.name ?? 'Decal Receivers'
    this.enabled = options.enabled ?? this.enabled
    this.stencilBit = options.stencilBit
    this.stencil = StencilState.get({
      enable: true,
      readMask: options.stencilBit,
      writeMask: 0,
      frontFunction: 'equal',
      backFunction: 'equal',
    })
    device.ready.then(() => {
      this.program = device
        .createShaderModule({ name: 'NW Decal Receiver Debug', wgsl: { source: TINT_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    if (!this.enabled || !this.program?.isCompiled) {
      return
    }
    frame.addPass(this)
    this.depth = frame.read(RenderChannel.Depth)
    this.color = frame.modifyInPlace(RenderChannel.Color)
  }

  public render(ctx: RenderContext): void {
    const pass = ctx.device.renderPass
    const target = this.color.texture
    pass.flush()
    pass.setRenderTarget(0, target)
    pass.setDepthTarget(this.depth.texture)
    pass.setViewportState(0, 0, target.width, target.height)
    // a depth-stencil attachment needs a depth compare, this one always passes and never writes
    pass.setDepthState(DEPTH_ALWAYS)
    pass.setCullState(CullState.Disabled)
    pass.setStencilState(this.stencil)
    pass.setStencilReference(this.stencilBit)
    pass.setRenderBlend(0, BlendState.Alpha)
    this.program.commit()
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setStencilState(StencilState.Default)
    pass.setStencilReference(0)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setDepthState(DepthState.Disabled)
    pass.setDepthTarget(null)
    pass.setRenderTarget(0, null)
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
