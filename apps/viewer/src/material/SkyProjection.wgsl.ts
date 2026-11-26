import { NISHITA_SKY_UTILS_WGSL, FULLSCREEN_WGSL_VS } from '@gglib/effects'

export default /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${NISHITA_SKY_UTILS_WGSL}

struct ParamsBlock {
  waveLengthInv     : vec3f, // pow(waveLength * 0.001, -4.0)
  sunIntensity      : vec3f,
  sunLatitude       : f32,
  sunLongitude      : f32,
  mieScattering     : f32, // km
  rayleighScattering: f32, // kr
  phaseAsymmetry    : f32, // g

  nightSkyColorBase   : vec3f,
  nightSkyColorDelta  : vec3f,
  nightSkyColorShift  : vec2f,
  nightMoonColor      : vec3f,
  nightMoonInnerColor : vec3f,
  nightMoonOuterColor : vec3f,
  nightMoonDirSize    : vec4f,
};
@group(0) @binding(0) var<uniform> params: ParamsBlock;
@group(0) @binding(1) var mieScatteringMap: texture_2d<f32>;
@group(0) @binding(2) var mieScatteringSampler: sampler;
@group(0) @binding(3) var rayleighScatteringMap: texture_2d<f32>;
@group(0) @binding(4) var rayleighScatteringSampler: sampler;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  var uv = in.uv;
  // expand uv.y to cover lower hemisphere
  // which will receive the ground color below
  uv.y = 2.0 * uv.y;

  let skyDir = uvToDir(uv);
  let sunDir = latLonToDir(params.sunLatitude, params.sunLongitude);
  let km = params.mieScattering;
  let kr = params.rayleighScattering;
  let g = params.phaseAsymmetry;
  let ground = params.groundColor;

  let mieColor      = textureSample(mieScatteringMap, mieScatteringSampler, uv).rgb;
  let rayleighColor = textureSample(rayleighScatteringMap, rayleighScatteringSampler, uv).rgb;

  let cosAngle      = dot(skyDir, -sunDir);
  let miePhase      = getMiePhase(g, cosAngle);
  let rayleighPhase = getRayleighPhase(cosAngle);

  let partialMieConst      = params.sunIntensity * km;
  let partialRayleighConst = params.sunIntensity * kr * params.waveLengthInv;

  var color = vec3(0.0);
  if (uv.y <= 1.0) {
    // upper hemisphere
    color += rayleighColor * partialRayleighConst * rayleighPhase;
    color += mieColor * partialMieConst * miePhase;
  } else {
    // lower hemisphere, ground color contribution
    color = rayleighColor * partialRayleighConst * rayleighPhase * ground;
  }
  color = min(color, vec3f(60000.0));

  return vec4f(color, 1.0);
}
`
