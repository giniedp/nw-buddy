import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { GBUFFER_WGSL } from '../../../material/gbuffer.wgsl'

/**
 * Debug modes of the snow pass (params.x)
 */
export const SnowDebugModes = ['off', 'passthrough', 'coverage'] as const
export type SnowDebugMode = (typeof SnowDebugModes)[number]

/**
 * Copies GBuffer A/B/C into the snow inputs in one draw (the game copies them with three StretchRects)
 */
export const SNOW_COPY_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

@group(0) @binding(0) var sourceA: texture_2d<f32>;
@group(0) @binding(1) var sourceB: texture_2d<f32>;
@group(0) @binding(2) var sourceC: texture_2d<f32>;

struct CopyOutput {
  @location(0) a: vec4f,
  @location(1) b: vec4f,
  @location(2) c: vec4f,
};

@fragment
fn fs_main(in: FragmentInput) -> CopyOutput {
  let p = vec2i(in.position.xy);
  var out: CopyOutput;
  out.a = textureLoad(sourceA, p, 0);
  out.b = textureLoad(sourceB, p, 0);
  out.c = textureLoad(sourceC, p, 0);
  return out;
}
`

/**
 * Deferred snow layer, a port of the game's DeferredSnowPS.
 *
 * Decodes the GBuffer copies, adds snow and frost, encodes into GBuffer A/B/C without blending. Stencil tested on the
 * snow receivers and scissored to the snow sphere by the pass. The pass copies the camera and the snow volume of the
 * global inputs (snowVolumeParams, snowMultipliers, snowBrightness, oceanLevel) into its params: the shader does not
 * include the material globals, their group 0 bindings (probe cube arrays) would not be bound in a fullscreen pass.
 *
 * All texture samples and the position derivatives run in uniform control flow (no early returns): the GBuffer clear
 * (no geometry) never has the receiver stencil bit, so no depth test is needed.
 * Not ported: the rain occlusion map (%_RT_SAMPLE0), occlusion is 1 (plan phase 3).
 */
export const SNOW_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

const LIGHTINGMODEL_STANDARD:      u32 = 0u;
const LIGHTINGMODEL_TRANSMITTANCE: u32 = 1u;
${GBUFFER_WGSL}

struct SnowParams {
  inverseViewProjection : mat4x4f,
  // xyz = camera position, w = far plane
  camera                : vec4f,
  // xy = render size in pixels
  viewport              : vec4f,
  // g_SnowVolumeParams: xyz = center, w = 1 / radius
  volume                : vec4f,
  // g_SnowMultipliers: x = snow, y = frost, z = saturated surface freezing
  multipliers           : vec4f,
  // x = g_SnowBrightness, y = g_FrostBrightness
  brightness            : vec4f,
  // x = debug mode, y = ocean level (PerFrame_WaterLevel)
  values                : vec4f,
};

@group(0) @binding(0)  var gbufferA         : texture_2d<f32>;
@group(0) @binding(1)  var gbufferB         : texture_2d<f32>;
@group(0) @binding(2)  var gbufferC         : texture_2d<f32>;
// @unfilterable
@group(0) @binding(3)  var linearDepth     : texture_2d<f32>;
@group(0) @binding(4)  var<uniform> params  : SnowParams;
@group(0) @binding(5)  var snowSampler      : sampler;
// EngineAssets/Textures/defaults/perlinnoise2d.dds, breaks up the circular boundary
@group(0) @binding(6)  var arealNoiseMap    : texture_2d<f32>;
// EngineAssets/Textures/perlinNoiseDerivatives.dds
@group(0) @binding(7)  var derivativesMap   : texture_2d<f32>;
// EngineAssets/Textures/frozen/snow_spatter.dds
@group(0) @binding(8)  var spatterMap       : texture_2d<f32>;
// EngineAssets/Textures/frozen/frost_noise3.dds
@group(0) @binding(9)  var frostBumpMap     : texture_2d<f32>;
// EngineAssets/Textures/frozen/frost_noise4.dds
@group(0) @binding(10) var frostBubblesMap  : texture_2d<f32>;
// EngineAssets/Textures/Noise3D.dds
@group(0) @binding(11) var volumeNoiseMap   : texture_3d<f32>;

struct SnowOutput {
  @location(0) a: vec4f,
  @location(1) b: vec4f,
  @location(2) c: vec4f,
};

// world position of a pixel at a linear view depth, through the far plane point (reversed z: ndc 0 = far)
fn snowWorldPos(fragCoord: vec2f, viewDepth: f32) -> vec3f {
  let ndc = vec4f(
    (fragCoord.x / params.viewport.x) * 2.0 - 1.0,
    1.0 - (fragCoord.y / params.viewport.y) * 2.0,
    0.0,
    1.0,
  );
  let farH = params.inverseViewProjection * ndc;
  let farPos = farH.xyz / farH.w;
  return params.camera.xyz + (farPos - params.camera.xyz) * (viewDepth / params.camera.w);
}

// GetSnowAttenuation: falloff in the xy plane, z is ignored so that peaks above the center keep their snow
fn snowAttenuation(relativePos: vec2f, inverseRadius: f32) -> f32 {
  let p = relativePos * inverseRadius;
  let len2 = dot(p, p);
  return smoothstep(0.0, 1.0, saturate(1.0 - len2 * len2));
}

fn snowExpand(v: vec2f) -> vec2f {
  return v * 2.0 - 1.0;
}

fn snowSample(map: texture_2d<f32>, uv: vec2f) -> vec4f {
  return textureSample(map, snowSampler, uv);
}

@fragment
fn fs_main(in: FragmentInput) -> SnowOutput {
  let p = vec2i(in.position.xy);
  let inA = textureLoad(gbufferA, p, 0);
  let inB = textureLoad(gbufferB, p, 0);
  let inC = textureLoad(gbufferC, p, 0);

  let depth = textureLoad(linearDepth, p, 0).r;
  let position = snowWorldPos(in.position.xy, depth);
  let viewDir = normalize(params.camera.xyz - position);

  var s = decodeGBuffer(inA, inB, inC);
  let normal = s.normal;

  let volume = params.volume;
  let multipliers = params.multipliers;
  let brightness = params.brightness;

  // XYZ blending of the world space (triplanar) samples
  let surfBlend = saturate(abs(normal) - 0.25);

  // perturbed normal from the derivative map (surface gradient)
  let sigmaX = dpdx(position);
  let sigmaY = dpdy(position);
  let r1 = cross(sigmaY, normal);
  let r2 = cross(normal, sigmaX);
  let det = dot(sigmaX, r1);
  let posDeriv = position * 1.7;
  var dHdST = snowExpand(snowSample(derivativesMap, posDeriv.xy).xy) * surfBlend.z;
  dHdST += snowExpand(snowSample(derivativesMap, posDeriv.yz).xy) * surfBlend.x;
  dHdST += snowExpand(snowSample(derivativesMap, posDeriv.zx).xy) * surfBlend.y;
  dHdST *= 8.0;
  let dHdxy = vec2f(dot(dHdST, sigmaX.xy), dot(dHdST, sigmaY.xy));
  let grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  var snowNormal = abs(det) * normal - grad;
  snowNormal /= length(snowNormal) + 1e-6;

  // attenuation: areal noise breaks up the circle, two radii (snow layer and the frost boundary)
  let spatterPos = position.xy * 0.01;
  var noiseAttenuation = smoothstep(0.05, 0.7, snowSample(arealNoiseMap, spatterPos).x);
  noiseAttenuation += 0.75 * smoothstep(0.05, 0.7, snowSample(arealNoiseMap, spatterPos * 2.3).x);
  noiseAttenuation += 0.5 * smoothstep(0.05, 0.65, snowSample(arealNoiseMap, spatterPos * 3.7).x);
  let distanceAttenuation = snowAttenuation(volume.xy - position.xy, volume.w * 1.2);
  let outerAttenuation = snowAttenuation(volume.xy - position.xy, volume.w);
  var attenuation = noiseAttenuation * outerAttenuation + 0.9 * distanceAttenuation;
  let waterAttenuation = saturate((position.z - params.values.y + 0.125) * 4.0);
  attenuation *= waterAttenuation * waterAttenuation;

  // spattering mask
  let spatterTC = position * 10.0;
  var spatter = snowSample(spatterMap, spatterTC.yz).x * surfBlend.x;
  spatter += snowSample(spatterMap, spatterTC.zx).x * surfBlend.y;
  spatter += snowSample(spatterMap, spatterTC.xy).x * surfBlend.z;
  let spatterVariation = spatter * 0.1 * saturate(1.0 - multipliers.x * 0.1);

  // variation. The game reads .w of Noise3D.dds, an alpha only texture that loads as r8unorm (red)
  let tcVariation = position * 0.5;
  var frostVariation = textureSample(volumeNoiseMap, snowSampler, tcVariation * 0.25).r;
  frostVariation *= textureSample(volumeNoiseMap, snowSampler, tcVariation * 0.5 + frostVariation).r * 2.0;
  frostVariation *= textureSample(
    volumeNoiseMap, snowSampler, tcVariation * 1.25 + (frostVariation - spatterVariation * frostVariation)
  ).r * 4.0;
  frostVariation = saturate(frostVariation * 0.5 - 0.125);
  let freezingVariation = frostVariation;

  // frost pattern
  let disp = frostVariation * 0.01;
  var frostTC = position * 2.5 + vec3f(disp);
  var frostNoise = snowSample(frostBumpMap, frostTC.yz) * surfBlend.x;
  frostNoise += snowSample(frostBumpMap, frostTC.zx) * surfBlend.y;
  frostNoise += snowSample(frostBumpMap, frostTC.xy) * surfBlend.z;
  let frostNoiseN = normalize(frostNoise.xyz);
  let frostNoiseW = dot(frostNoiseN, vec3f(0.33)) * 2.0 - 1.0;

  // no rain occlusion map yet (plan phase 3)
  let occlusion = 1.0;

  // snow and frost amounts
  let amount = min(10.0, multipliers.x) * attenuation * occlusion;
  let snowAmount = max(1e-6, 10.0 / max(1e-6, amount));
  let frostAmount = saturate(multipliers.y * attenuation * occlusion);
  let frostPower = max(0.5, (2.0 - min(1.0, multipliers.y)) * attenuation);
  let surfaceFreezing = multipliers.z;

  // frost bubbles, 3 parallax taps per axis
  let parallax = viewDir * saturate(frostNoiseW) * 0.25;
  frostTC *= 2.0;
  var bubbles = vec3f(0.0);
  bubbles.x += snowSample(frostBubblesMap, frostTC.yz + vec2f(0.25, 0.0) + parallax.yz).w;
  bubbles.y += snowSample(frostBubblesMap, frostTC.zx + vec2f(0.25, 0.0) + parallax.zx).w;
  bubbles.z += snowSample(frostBubblesMap, frostTC.xy + vec2f(0.25, 0.0) + parallax.xy).w;
  bubbles.x += snowSample(frostBubblesMap, frostTC.yz + (vec2f(0.0, 0.15) + 2.0 * parallax.yz)).w;
  bubbles.y += snowSample(frostBubblesMap, frostTC.zx + (vec2f(0.0, 0.15) + 2.0 * parallax.zx)).w;
  bubbles.z += snowSample(frostBubblesMap, frostTC.xy + (vec2f(0.0, 0.15) + 2.0 * parallax.xy)).w;
  bubbles.x += snowSample(frostBubblesMap, frostTC.yz + (vec2f(0.35, 0.75) + 3.0 * parallax.yz)).w;
  bubbles.y += snowSample(frostBubblesMap, frostTC.zx + (vec2f(0.35, 0.75) + 3.0 * parallax.zx)).w;
  bubbles.z += snowSample(frostBubblesMap, frostTC.xy + (vec2f(0.35, 0.75) + 3.0 * parallax.xy)).w;
  bubbles *= surfBlend;

  let bubblesFrost = pow(bubbles * frostVariation * frostAmount, vec3f(frostPower));
  let fBubbles = saturate(vec2f(dot(bubbles, vec3f(1.0)), dot(bubblesFrost, vec3f(1.0))) - 0.25);
  frostVariation = saturate(frostVariation - saturate(1.0 - amount * 0.1));

  // frost glitter
  let glitterBubbles = fBubbles * select(vec2f(1.0), vec2f(20.0), fBubbles * 0.333 > vec2f(0.2));

  // snow diffuse variation and blending
  let iceTop = saturate(1.0 - 0.4 * frostVariation);
  let iceTopZ = saturate((pow(max(0.0001, normal.z), snowAmount) - 0.2) * 10.0) * brightness.x;
  var blending = vec4f(
    fBubbles.y,
    iceTop,
    saturate(surfaceFreezing * normal.z * freezingVariation * attenuation),
    iceTopZ * saturate(frostVariation * 8.0),
  );
  // the game's diffuse target holds the encoded albedo
  blending.r += blending.b * saturate(dot(inB.rgb, vec3f(1.0)) * 1.5);

  s.albedo = mix(s.albedo, vec3f(iceTop), blending.a) + blending.r * brightness.y;
  s.normal = normalize(mix(normal, snowNormal, blending.a));
  // 8 bit targets in the game saturate
  s.smoothness = saturate(mix(s.smoothness, spatter * 0.4, blending.a) + glitterBubbles.y);
  s.reflectance = saturate(mix(s.reflectance, vec3f(spatter * (40.0 / 255.0)), blending.a) + glitterBubbles.y);

  let encoded = encodeGBuffer(s, depth);
  var out: SnowOutput;
  out.a = encoded.a;
  out.b = encoded.b;
  out.c = encoded.c;
  switch (u32(params.values.x)) {
    // passthrough: the input unchanged (plumbing check)
    case 1u: {
      out.a = inA;
      out.b = inB;
      out.c = inC;
    }
    // coverage: snow (a) and frost (r) as albedo, neutral surface
    case 2u: {
      var d = s;
      d.albedo = vec3f(blending.r, blending.a / max(brightness.x, 1e-3), 0.0);
      d.normal = normal;
      let e = encodeGBuffer(d, depth);
      out.a = e.a;
      out.b = e.b;
      out.c = vec4f(0.0, inC.yzw);
    }
    default: {}
  }
  return out;
}
`
