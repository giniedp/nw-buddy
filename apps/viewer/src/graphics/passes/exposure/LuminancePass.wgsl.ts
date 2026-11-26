import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * Scene luminance for the eye adaptation, port of HDRSampleLumInitialPS, HDRSampleLumIterativePS and
 * HDRCalculateAdaptedLumPS (HDRPostProcess.cfx). All targets hold x = luminance, y = illuminance.
 */
const LUMINANCE_PARAMS = /* wgsl */ `
struct LuminanceParams {
  // x = base color luminance (constant, the game reads the G-buffer albedo), y = adaptation factor
  // z = 1 on the last reduction step (converts the log average back with exp)
  params : vec4f,
};
@group(0) @binding(0) var<uniform> params: LuminanceParams;
`

/**
 * Log luminance and log illuminance of the HDR scene, averaged over a 4x4 grid of the source block of each texel.
 * The game samples a quarter resolution target with 4 bilinear taps.
 */
export const LUMINANCE_INITIAL_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${LUMINANCE_PARAMS}
@group(0) @binding(1) var sourceMap: texture_2d<f32>;

const PI: f32 = 3.14159265;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let srcSize = vec2f(textureDimensions(sourceMap));
  let dstSize = vec2f(64.0);
  let block = srcSize / dstSize;
  let origin = floor(in.position.xy) * block;
  let baseColorLum = params.params.x;
  var sum = vec2f(0.0);
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 4; x++) {
      let p = vec2i(origin + (vec2f(f32(x), f32(y)) + 0.5) * block / 4.0);
      let c = textureLoad(sourceMap, min(p, vec2i(srcSize) - 1), 0).rgb;
      let lum = max(dot(c, vec3f(0.2126, 0.7152, 0.0722)), 1e-4);
      sum += vec2f(log(lum), log(lum / baseColorLum * PI + 1e-4));
    }
  }
  return vec4f(sum / 16.0, 0.0, 1.0);
}
`

/**
 * Average of 4x4 texels, exp on the last step
 */
export const LUMINANCE_REDUCE_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${LUMINANCE_PARAMS}
@group(0) @binding(1) var sourceMap: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let origin = vec2i(floor(in.position.xy)) * 4;
  var sum = vec2f(0.0);
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 4; x++) {
      sum += textureLoad(sourceMap, origin + vec2i(x, y), 0).xy;
    }
  }
  var avg = sum / 16.0;
  if (params.params.z > 0.5) {
    avg = exp(avg);
  }
  return vec4f(avg, 0.0, 1.0);
}
`

/**
 * Exponential adaptation of the previous towards the current luminance
 */
export const LUMINANCE_ADAPT_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${LUMINANCE_PARAMS}
@group(0) @binding(1) var previousMap: texture_2d<f32>;
@group(0) @binding(2) var currentMap: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let previous = textureLoad(previousMap, vec2i(0), 0).xy;
  let current = textureLoad(currentMap, vec2i(0), 0).xy + 1e-6;
  let adapted = max(vec2f(0.0), previous + (current - previous) * params.params.y);
  return vec4f(adapted, 0.0, 1.0);
}
`
