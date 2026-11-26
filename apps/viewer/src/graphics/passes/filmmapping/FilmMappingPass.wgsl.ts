import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * Port of FilmMapping in HDRPostProcess.cfx without vignetting. The bloom (BloomPass, quarter resolution) is blended
 * in before the exposure: lerp(scene, bloom, HDRBloomColor).
 */
export const FILM_MAPPING_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct FilmMappingParams {
  // rgb = color balance, a = saturation (HDRColorBalance)
  colorBalance : vec4f,
  // x = shoulder, y = midtones, z = toe, w = whitepoint (HDRFilmCurve)
  filmCurve    : vec4f,
  // x = exposure without eye adaptation (HDRTonemapParams.x), y = bloom blend factor (HDRBloomColor)
  exposure     : vec4f,
  // x = EV min, y = EV max, z = EV auto compensation, w = 1 uses the adapted luminance (HDREyeAdaptation)
  eyeAdaptation: vec4f,
  // x = 1 multiplies the color by the scene alpha: premultiplied output for a transparent canvas, else opaque
  // y = 1 exposes pixels without geometry (alpha 0) with the adapted luminance while the exposure is fixed
  output       : vec4f,
};
@group(0) @binding(0) var<uniform> params: FilmMappingParams;
@group(0) @binding(1) var sourceMap: texture_2d<f32>;
// 1x1 adapted luminance, x = luminance, y = illuminance (LuminancePass)
@group(0) @binding(2) var lumMap: texture_2d<f32>;
// quarter resolution bloom (BloomPass), black while there is none
@group(0) @binding(3) var bloomMap: texture_2d<f32>;
@group(0) @binding(4) var bloomSampler: sampler;

const LIGHT_UNIT_SCALE: f32 = 10000.0;

fn computeExposure(sceneAlpha: f32) -> f32 {
  if (params.eyeAdaptation.w > 0.5) {
    return adaptedExposure();
  }
  if (params.output.y > 0.5) {
    return mix(adaptedExposure(), params.exposure.x, saturate(sceneAlpha));
  }
  return params.exposure.x;
}

// ComputeExposure, EV mode (shadelib.cfi), the only path in the tone mapping shader of the game
fn adaptedExposure() -> f32 {
  let illuminance = textureLoad(lumMap, vec2i(0), 0).y;
  // EV with ISO 100 and standard camera settings
  var ev100 = log2(illuminance * LIGHT_UNIT_SCALE * 100.0 / 330.0);
  // automatic exposure compensation based on the scene key
  ev100 -= ((clamp(log10(illuminance * LIGHT_UNIT_SCALE + 1.0), 0.1, 5.2) - 3.0) / 2.0) * params.eyeAdaptation.z;
  ev100 = clamp(ev100, params.eyeAdaptation.x, params.eyeAdaptation.y);
  // maximum luminance from the saturation based film sensitivity (ISO 100, lens factor q = 0.65)
  let maxLum = 1.2 * exp2(ev100) / LIGHT_UNIT_SCALE;
  return 1.0 / maxLum;
}

fn log10(x: f32) -> f32 {
  return log2(x) * 0.30103;
}

fn filmCurve(c: vec4f) -> vec4f {
  let shoulderStrength = 0.22 * params.filmCurve.x;
  let linearStrength = 0.3 * params.filmCurve.y;
  const linearAngle = 0.1;
  const toeStrength = 0.2;
  let toeNumerator = 0.01 * params.filmCurve.z;
  const toeDenominator = 0.3;
  return ((c * (shoulderStrength * c + linearAngle * linearStrength) + toeStrength * toeNumerator)
    / (c * (shoulderStrength * c + linearStrength) + toeStrength * toeDenominator)) - toeNumerator / toeDenominator;
}

fn linearToSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, 12.92 * c, c <= vec3f(0.0031308));
}

@fragment
fn fs(in: FragmentInput) -> @location(0) vec4f {
  let scene = textureLoad(sourceMap, vec2i(in.position.xy), 0);
  let bloom = textureSampleLevel(bloomMap, bloomSampler, in.uv, 0.0).rgb;
  var color = computeExposure(scene.a) * mix(scene.rgb, bloom, saturate(params.exposure.y));

  let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  color = mix(vec3f(luminance), color, params.colorBalance.a);
  color *= params.colorBalance.rgb;

  let compressed = filmCurve(vec4f(max(color, vec3f(0.0)), params.filmCurve.w));
  let mapped = linearToSrgb(saturate(compressed.rgb / compressed.a));
  // a transparent canvas takes premultiplied colors: fog and bloom over the background must not show
  let alpha = select(1.0, scene.a, params.output.x > 0.5);
  return vec4f(mapped * alpha, alpha);
}
`
