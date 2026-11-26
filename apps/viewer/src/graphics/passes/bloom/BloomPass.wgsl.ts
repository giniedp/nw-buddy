import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * DownsampleStablePS (posteffects.cfx): 13 bilinear taps combined as five 4x4 blocks, the half resolution step
 * compresses each tap by 1 / (1 + luminance) before averaging and expands each block back (kill fireflies).
 */
export const BLOOM_DOWNSAMPLE_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct DownsampleParams {
  values: vec4f, // x = 1 kills fireflies
};
@group(0) @binding(0) var<uniform> params: DownsampleParams;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var sourceSampler: sampler;

fn bloomLuminance(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

fn tap(uv: vec2f, offset: vec2f, texel: vec2f) -> vec3f {
  var c = textureSampleLevel(source, sourceSampler, uv + offset * texel, 0.0).rgb;
  if (params.values.x > 0.5) {
    c /= 1.0 + bloomLuminance(c);
  }
  return c;
}

fn expand(c: vec3f) -> vec3f {
  if (params.values.x > 0.5) {
    // convert back to the uncompressed range
    return c / (1.0 - bloomLuminance(c));
  }
  return c;
}

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  // one texel of the (twice as large) source
  let texel = 1.0 / vec2f(textureDimensions(source));
  let uv = in.uv;

  let tl = tap(uv, vec2f(-2.0, -2.0), texel);
  let tc = tap(uv, vec2f( 0.0, -2.0), texel);
  let tr = tap(uv, vec2f( 2.0, -2.0), texel);
  let ml = tap(uv, vec2f(-2.0,  0.0), texel);
  let mc = tap(uv, vec2f( 0.0,  0.0), texel);
  let mr = tap(uv, vec2f( 2.0,  0.0), texel);
  let bl = tap(uv, vec2f(-2.0,  2.0), texel);
  let bc = tap(uv, vec2f( 0.0,  2.0), texel);
  let br = tap(uv, vec2f( 2.0,  2.0), texel);
  let c0 = tap(uv, vec2f(-1.0, -1.0), texel);
  let c1 = tap(uv, vec2f( 1.0, -1.0), texel);
  let c2 = tap(uv, vec2f( 1.0,  1.0), texel);
  let c3 = tap(uv, vec2f(-1.0,  1.0), texel);

  let blockTL = expand((tl + tc + ml + mc) / 4.0);
  let blockTR = expand((tc + tr + mc + mr) / 4.0);
  let blockBR = expand((mc + mr + bc + br) / 4.0);
  let blockBL = expand((ml + mc + bl + bc) / 4.0);
  let blockCC = expand((c0 + c1 + c2 + c3) / 4.0);

  return vec4f(0.5 * blockCC + 0.125 * (blockTL + blockTR + blockBR + blockBL), 1.0);
}
`

/**
 * HDRBloomGaussianPS (hdrpostprocess.cfx): 15 tap binomial blur along params.step (texture coordinates). The last
 * pass composes the sum of Gaussians with the result of the first blur (bloomMap).
 */
export const BLOOM_GAUSSIAN_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct GaussianParams {
  values: vec4f, // xy = step in texture coordinates, z = 1 composes with bloomMap
};
@group(0) @binding(0) var<uniform> params: GaussianParams;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var bloomMap: texture_2d<f32>;
@group(0) @binding(3) var sourceSampler: sampler;

const WEIGHTS = array<f32, 15>(153.0, 816.0, 3060.0, 8568.0, 18564.0, 31824.0, 43758.0, 48620.0, 43758.0, 31824.0,
  18564.0, 8568.0, 3060.0, 816.0, 153.0);
const WEIGHT_SUM: f32 = 262106.0;

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  let step = params.values.xy;
  var coords = in.uv - step * 7.0;
  var color = vec3f(0.0);
  for (var i = 0; i < 15; i++) {
    color += textureSampleLevel(source, sourceSampler, coords, 0.0).rgb * (WEIGHTS[i] / WEIGHT_SUM);
    coords += step;
  }
  if (params.values.z > 0.5) {
    // compose the sum of Gaussians: 0.0174 * G(0.008, r) + 0.192 * G(0.0576, r) approximates (1 - r)^4
    let bloom0 = textureSampleLevel(bloomMap, sourceSampler, in.uv, 0.0).rgb;
    color = (0.0174 * bloom0 + 0.192 * color) / (0.0174 + 0.192);
  }
  return vec4f(color, 1.0);
}
`
