import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { BlendState, DepthState, type Device, type Program } from '@gglib/graphics'
import { FrameGraph, type FrameResource, type RenderChannel, type RenderContext, type RenderPass } from '@gglib/render'

/**
 * Port of FilterGBufferPS (deferredshading.cfx). Writes GBuffer C: r = smoothness, g = sqrt reflectance luma
 * (layout in material/gbuffer.wgsl.ts, the same as the game's specular buffer).
 */
export const FILTER_GBUFFER_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

// the game clamps the roughness of this filter with MIN_ROUGHNESS of shadelib.cfi
const FILTER_MIN_ROUGHNESS: f32 = 0.001;

@group(0) @binding(0) var gbufferA    : texture_2d<f32>;
// copy of GBuffer C, the target of this pass
@group(0) @binding(1) var gbufferC    : texture_2d<f32>;
// @unfilterable
@group(0) @binding(2) var linearDepth : texture_2d<f32>;

fn filterNormal(p: vec2i) -> vec3f {
  return normalize(textureLoad(gbufferA, p, 0).xyz * 2.0 - 1.0);
}

fn filterDepth(p: vec2i) -> f32 {
  return textureLoad(linearDepth, p, 0).r;
}

// weight of a neighbour, rejects depth discontinuities (the game: |depth delta| * far * 4, in world units)
fn filterWeight(p: vec2i, depthCenter: f32) -> f32 {
  return 1.0 - saturate(abs(filterDepth(p) - depthCenter) * 4.0);
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(gbufferC));
  let p = vec2i(in.position.xy);
  let specBuf = textureLoad(gbufferC, p, 0);
  var out = specBuf;

  let authoredSmoothness = specBuf.x;
  let depthCenter = filterDepth(p);
  // pixels without geometry have a linear depth of 0
  if (authoredSmoothness <= 0.3 || depthCenter <= 0.0) {
    return out;
  }

  let pB = min(p + vec2i(0, 1), size - 1);
  let pT = max(p - vec2i(0, 1), vec2i(0));
  let pR = min(p + vec2i(1, 0), size - 1);
  let pL = max(p - vec2i(1, 0), vec2i(0));
  let weightB = filterWeight(pB, depthCenter);
  let weightT = filterWeight(pT, depthCenter);
  let weightR = filterWeight(pR, depthCenter);
  let weightL = filterWeight(pL, depthCenter);

  var avgNormal = filterNormal(p);
  avgNormal += filterNormal(pB) * weightB;
  avgNormal += filterNormal(pT) * weightT;
  avgNormal += filterNormal(pR) * weightR;
  avgNormal += filterNormal(pL) * weightL;
  avgNormal /= (1.0 + weightB + weightT + weightR + weightL);

  var finalSmoothness = authoredSmoothness;
  let len = length(avgNormal);
  if (len < 1.0) {
    let authoredRoughness = max((1.0 - authoredSmoothness) * (1.0 - authoredSmoothness), FILTER_MIN_ROUGHNESS);
    // derive new roughness based on normal variance
    let kappa = (3.0 * len - len * len * len) / (1.0 - len * len);
    let variance = 1.0 / (2.0 * kappa);
    let finalRoughness = sqrt(authoredRoughness * authoredRoughness + variance);
    finalSmoothness = 1.0 - sqrt(finalRoughness);
  }
  out.x = finalSmoothness;

  // reduce specular intensity for dielectrics to reduce outline artifacts when Fresnel gain is strong
  var specLumLinear = specBuf.y * specBuf.y;
  if (specLumLinear < 0.05) {
    let epsilon = 0.0001;
    specLumLinear *= (finalSmoothness + epsilon) / (authoredSmoothness + epsilon);
    out.y = sqrt(specLumLinear);
  }
  return out;
}
`

export interface FilterGBufferPassOptions {
  /**
   * GBuffer A (normals)
   */
  a: RenderChannel
  /**
   * GBuffer C, rewritten by this pass
   */
  c: RenderChannel
  /**
   * Copy of GBuffer C (CopyPass before this pass)
   */
  cCopy: RenderChannel
  /**
   * Linear view depth of the GBuffer pass, 0 without geometry
   */
  linearDepth: RenderChannel
}

/**
 * The game's FilterGBuffer (r_DeferredShadingFilterGBuffer): after the GBuffer, the decals and the snow, before AO,
 * SSR and the lighting. Widens the roughness of smooth surfaces (smoothness > 0.3) by the variance of the normals of
 * the pixel and its 4 neighbours, and dims the reflectance of dielectrics by the same ratio (specular antialiasing).
 */
export class FilterGBufferPass implements RenderPass {
  public name: string = 'FilterGBuffer'
  public enabled = true

  private options: FilterGBufferPassOptions
  private program: Program
  private isActive = false
  private target: FrameResource
  private inputs: FrameResource[] = []

  public constructor(device: Device, options: FilterGBufferPassOptions) {
    this.options = options
    device.ready.then(() => {
      this.program = device
        .createShaderModule({ name: 'NW Filter GBuffer', wgsl: { source: FILTER_GBUFFER_WGSL } })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && !!this.program?.isCompiled
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    const { a, c, cCopy, linearDepth } = this.options
    this.target = frame.modifyInPlace(c)
    this.inputs = [frame.read(a), frame.read(cCopy), frame.read(linearDepth)]
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const pass = ctx.device.renderPass
    const target = this.target.texture
    const program = this.program
    pass.flush()
    program.mustSet('gbufferA', this.inputs[0].texture)
    program.mustSet('gbufferC', this.inputs[1].texture)
    program.mustSet('linearDepth', this.inputs[2].texture)
    program.commit()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderTarget(0, target)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, target.width, target.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
    pass.setRenderTarget(0, null)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }
}
