import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * Sun shafts, port of SunShafts.cfx (SunShaftsMaskGenPS, SunShaftsGenPS) and the sun shafts blend
 * of the HDR final pass (ApplyMergedProcesses in HDRPostProcess.cfx).
 */
const SUN_SHAFTS_PARAMS = /* wgsl */ `
struct SunShaftsParams {
  // xy = sun position in screen uv (top left origin), w = sign, sun direction dot camera forward
  sunPos      : vec4f,
  // x = radial step (PI_sunShaftsParams.x), y = rays attenuation (PI_sunShaftsParams.y)
  // z = jitter of the sample offsets in steps (0 = none), not in the original
  shafts      : vec4f,
  // x = 1 / far (normalizes linear depth), y = aspect ratio correction (1.333 * height / width)
  // zw = size of the full resolution inputs
  screen      : vec4f,
  // rgb = rays color (SunShafts_SunCol)
  color       : vec4f,
};
@group(0) @binding(0) var<uniform> params: SunShaftsParams;
`

/**
 * SunShaftsMaskGenPS: scene depth (normalized linear, 1 = far / sky) weighted by the scene brightness.
 * The original reads the half resolution depth and HDR targets, the inputs are averaged over 2x2 pixels here.
 */
export const SUN_SHAFTS_MASK_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${SUN_SHAFTS_PARAMS}
@group(0) @binding(1) var colorMap: texture_2d<f32>;
// @unfilterable
@group(0) @binding(2) var depthMap: texture_2d<f32>;

fn sceneDepth01(p: vec2i) -> f32 {
  let d = textureLoad(depthMap, p, 0).r;
  // no depth (cleared) or far plane is sky
  if (d <= 0.0) {
    return 1.0;
  }
  return saturate(d * params.screen.x);
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let size = vec2i(params.screen.zw);
  let p = min(vec2i(in.uv * params.screen.zw - 0.5), size - 2);
  var depth = 0.0;
  var color = vec3f(0.0);
  for (var y = 0; y < 2; y++) {
    for (var x = 0; x < 2; x++) {
      let q = clamp(p + vec2i(x, y), vec2i(0), size - 1);
      depth += sceneDepth01(q);
      color += textureLoad(colorMap, q, 0).rgb;
    }
  }
  depth *= 0.25;
  color *= 0.25;

  var out = vec4f(depth, depth, depth, 1.0 - depth);
  // cheaper and looks nicer
  out = vec4f(out.xyz * dot(color, vec3f(0.33 * 4.0)), out.w);
  return out;
}
`

/**
 * SunShaftsGenPS: radial blur of the mask towards the sun, 8 taps with linear falloff.
 *
 * Not in the original: the sample offsets can be jittered per pixel (params.shafts.z) with interleaved gradient
 * noise. The first pass takes large steps, which shows as bands. Jittering it turns the bands into noise that the
 * second, narrow pass blurs away, at no extra taps.
 */
export const SUN_SHAFTS_GEN_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${SUN_SHAFTS_PARAMS}
@group(0) @binding(1) var maskMap: texture_2d<f32>;
@group(0) @binding(2) var maskSampler: sampler;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let sunPosProj = params.sunPos.xy;
  let fSign = params.sunPos.w;

  let sunVec = sunPosProj - in.uv;
  let sunDist = saturate(fSign) * saturate(1.0 - saturate(length(sunVec * vec2f(1.0, params.screen.y)) * params.shafts.y));
  let sunDir = (sunPosProj - in.uv) * params.shafts.x * fSign;

  // interleaved gradient noise (Jimenez 2014), offsets all taps by up to one step towards the sun
  let jitter = fract(52.9829189 * fract(dot(floor(in.position.xy), vec2f(0.06711056, 0.00583715)))) * params.shafts.z;

  var accum = textureSampleLevel(maskMap, maskSampler, in.uv + sunDir * jitter, 0.0);
  for (var i = 1; i < 8; i++) {
    let w = 1.0 - f32(i) / 8.0;
    accum += textureSampleLevel(maskMap, maskSampler, in.uv + sunDir * (f32(i) + jitter), 0.0) * w;
  }
  accum /= 8.0;

  var out = accum * 2.0 * vec4f(sunDist, sunDist, sunDist, 1.0);
  out.w += 1.0 - saturate(saturate(fSign * 0.1 + 0.9));
  return out;
}
`

/**
 * Blend of the sun shafts in the HDR final pass, after tone mapping:
 * finalCol.rgb += sunShafts * SunShafts_SunCol * (1 - finalCol.rgb)
 *
 * Outputs s = sunShafts * SunShafts_SunCol, blended with dst = s + dst * (1 - s)
 */
export const SUN_SHAFTS_APPLY_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${SUN_SHAFTS_PARAMS}
@group(0) @binding(1) var shaftsMap: texture_2d<f32>;
@group(0) @binding(2) var shaftsSampler: sampler;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let shafts = textureSampleLevel(shaftsMap, shaftsSampler, in.uv, 0.0).rgb;
  return vec4f(shafts * params.color.rgb, 1.0);
}
`
