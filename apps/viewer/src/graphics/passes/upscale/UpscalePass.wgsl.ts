import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * Upscale of the final image (sRGB encoded values in Color) to the output size, one fullscreen pass.
 *
 * - `fs_bilinear`: one bilinear tap
 * - `fs_bicubic`: the game's final upscale (postaa.cfx UpscaleImagePS with %_RT_SAMPLE0, common.cfi tex2D_bicubic):
 *   a cubic B-spline from 4 bilinear taps (Sigg and Hadwiger, GPU Gems 2 ch. 20). The game samples through an sRGB
 *   view, so it filters linear values; here the taps are decoded, filtered and encoded again.
 */
export const UPSCALE_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;

fn srgbToLinear(c: vec3f) -> vec3f {
  return select(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}

fn linearToSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, 12.92 * c, c <= vec3f(0.0031308));
}

fn sampleLinear(uv: vec2f) -> vec4f {
  let c = textureSampleLevel(source, linearSampler, uv, 0.0);
  return vec4f(srgbToLinear(max(c.rgb, vec3f(0.0))), c.a);
}

// B-spline weights (tex2D_bicubic_w0..w3)
fn bsplineW0(a: f32) -> f32 { return (1.0 / 6.0) * (a * (a * (-a + 3.0) - 3.0) + 1.0); }
fn bsplineW1(a: f32) -> f32 { return (1.0 / 6.0) * (a * a * (3.0 * a - 6.0) + 4.0); }
fn bsplineW2(a: f32) -> f32 { return (1.0 / 6.0) * (a * (a * (-3.0 * a + 3.0) + 3.0) + 1.0); }
fn bsplineW3(a: f32) -> f32 { return (1.0 / 6.0) * (a * a * a); }

@fragment
fn fs_bilinear(in: FragmentInput) -> @location(0) vec4f {
  return textureSampleLevel(source, linearSampler, in.uv, 0.0);
}

@fragment
fn fs_bicubic(in: FragmentInput) -> @location(0) vec4f {
  let res = vec2f(textureDimensions(source));
  let texel = 1.0 / res;
  // texel space, relative to texel centers
  let st = in.uv * res - 0.5;
  let i = floor(st);
  let f = st - i;

  let w0 = vec2f(bsplineW0(f.x), bsplineW0(f.y));
  let w1 = vec2f(bsplineW1(f.x), bsplineW1(f.y));
  let w2 = vec2f(bsplineW2(f.x), bsplineW2(f.y));
  let w3 = vec2f(bsplineW3(f.x), bsplineW3(f.y));
  // amplitudes (g0, g1) and offsets (h0, h1) of the two bilinear taps per axis
  let g0 = w0 + w1;
  let g1 = w2 + w3;
  let h0 = -1.0 + w1 / g0;
  let h1 = 1.0 + w3 / g1;

  let p0 = (i + vec2f(h0.x, h0.y) + 0.5) * texel;
  let p1 = (i + vec2f(h1.x, h0.y) + 0.5) * texel;
  let p2 = (i + vec2f(h0.x, h1.y) + 0.5) * texel;
  let p3 = (i + vec2f(h1.x, h1.y) + 0.5) * texel;
  let c = g0.y * (g0.x * sampleLinear(p0) + g1.x * sampleLinear(p1))
        + g1.y * (g0.x * sampleLinear(p2) + g1.x * sampleLinear(p3));
  return vec4f(linearToSrgb(max(c.rgb, vec3f(0.0))), c.a);
}
`
