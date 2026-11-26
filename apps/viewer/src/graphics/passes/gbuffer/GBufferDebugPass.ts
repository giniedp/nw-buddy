import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { BlendState, DepthState, type Device, type Program } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { GBUFFER_WGSL } from '../../../material/gbuffer.wgsl'

export const GBufferDebugModes = [
  'normal',
  'albedo',
  'reflectance',
  'smoothness',
  'occlusion',
  'lightingModel',
  'transmittance',
] as const
export type GBufferDebugMode = (typeof GBufferDebugModes)[number]

const DEBUG_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

const LIGHTINGMODEL_STANDARD:      u32 = 0u;
const LIGHTINGMODEL_TRANSMITTANCE: u32 = 1u;
${GBUFFER_WGSL}

struct DebugParams {
  values: vec4f, // x = mode, y = camera far plane
};

@group(0) @binding(0) var<uniform> params: DebugParams;
@group(0) @binding(1) var gbufferA: texture_2d<f32>;
@group(0) @binding(2) var gbufferB: texture_2d<f32>;
@group(0) @binding(3) var gbufferC: texture_2d<f32>;
// @unfilterable
@group(0) @binding(4) var linearDepth: texture_2d<f32>;

fn display(c: vec3f) -> vec3f {
  return pow(max(c, vec3f(0.0)), vec3f(1.0 / 2.2));
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let p = vec2i(in.position.xy);
  // no geometry: 0 from the GBuffer clear, or the far plane where the sky wrote it
  let depth = textureLoad(linearDepth, p, 0).r;
  if (depth <= 0.0 || depth >= params.values.y * 0.9999) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
  let s = decodeGBuffer(textureLoad(gbufferA, p, 0), textureLoad(gbufferB, p, 0), textureLoad(gbufferC, p, 0));
  switch (u32(params.values.x)) {
    case 0u: { return vec4f(s.normal * 0.5 + 0.5, 1.0); }
    case 1u: { return vec4f(display(s.albedo), 1.0); }
    case 2u: { return vec4f(display(s.reflectance), 1.0); }
    case 3u: { return vec4f(vec3f(s.smoothness), 1.0); }
    case 4u: { return vec4f(vec3f(s.occlusion), 1.0); }
    case 5u: {
      let colors = array<vec3f, 4>(vec3f(0.2), vec3f(0.1, 0.9, 0.2), vec3f(0.9, 0.6, 0.1), vec3f(0.9, 0.1, 0.9));
      return vec4f(colors[min(s.lightingModel, 3u)], 1.0);
    }
    default: { return vec4f(display(s.transmittance), 1.0); }
  }
}
`

export interface GBufferDebugPassOptions {
  a: RenderChannel
  b: RenderChannel
  c: RenderChannel
  /**
   * Scene linear depth, zero or the far plane where no geometry was rendered
   */
  linearDepth: RenderChannel
  mode?: GBufferDebugMode
  enabled?: boolean
}

/**
 * Shows a decoded gbuffer attribute in place of the final color
 */
export class GBufferDebugPass implements RenderPass {
  public name: string = 'GBuffer Debug'
  public enabled = true
  public mode: GBufferDebugMode

  private options: GBufferDebugPassOptions
  private program: Program
  private isActive = false
  private params = new Float32Array(4)
  private inputs: FrameResource[] = []
  private target: FrameResource

  public constructor(device: Device, options: GBufferDebugPassOptions) {
    this.options = options
    this.mode = options.mode ?? 'normal'
    this.enabled = options.enabled ?? this.enabled
    device.ready.then(() => {
      this.program = device.createShaderModule({ name: 'GBuffer Debug', wgsl: { source: DEBUG_WGSL } }).program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && !!this.program?.isCompiled
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    const { a, b, c, linearDepth } = this.options
    this.inputs = [frame.read(a), frame.read(b), frame.read(c), frame.read(linearDepth)]
    this.target = frame.modifyInPlace(RenderChannel.Color)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    const target = this.target.texture
    pass.flush()
    this.params[0] = GBufferDebugModes.indexOf(this.mode)
    this.params[1] = ctx.view.camera.far
    this.program.mustSet('params.values', this.params)
    this.program.mustSet('gbufferA', this.inputs[0].texture)
    this.program.mustSet('gbufferB', this.inputs[1].texture)
    this.program.mustSet('gbufferC', this.inputs[2].texture)
    this.program.mustSet('linearDepth', this.inputs[3].texture)
    this.program.commit()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderTarget(0, target)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(this.program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
