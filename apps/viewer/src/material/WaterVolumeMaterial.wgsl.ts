import { COMMON_WGSL } from './common.wgsl'
import { SSR_MATERIAL_WGSL } from './ssr.wgsl'
import { WATER_DDN_WGSL } from './water.wgsl'

/**
 * Water volume surface (rivers, water volumes), forward port of the game's watervolume.cfx (WaterVS, WaterPS).
 *
 * Differences to the game shader:
 * - $WaterVolumeDDN is replaced by waterDDNWaves, like the ocean (see water.wgsl)
 * - %SSREFL is traced inline against the SsrPass pyramids (Hi-Z + cone traced previous frame color) instead of the
 *   game's half resolution reflection prepass with temporal blend; the env map is the fallback (EnvCubeReflMul)
 * - no tessellation (%WATER_TESSELLATION_DX11), no vertex displacement (VertexWaveScale is 0 on rivers)
 * - no flow map, decal map or specular (gloss) map
 *
 * The vertex color holds the per volume fog (cFogColorDensity): rgb = fog color, a = fog density,
 * negative when the fog color is not affected by the sun.
 * The fade attribute holds the edge fade terms (see buildRiverMesh), the surface alpha is saturate(min(fade)).
 */
export default /* wgsl */ `
${COMMON_WGSL}
${WATER_DDN_WGSL}

struct MaterialBlock {
  // xyz = specular color, w = gloss
  specularColor              : vec4f,
  tiling                     : f32,
  detailTiling               : f32,
  normalsScale               : f32,
  detailNormalsScale         : f32,
  softIntersectionFactor     : f32,
  foamSoftIntersectionFactor : f32,
  foamAmount                 : f32,
  foamTiling                 : f32,
  envCubeReflMul             : f32,
  waterFlowSpeed             : f32,
  // $WaterVolumeDDN animation, shared with the ocean
  wavesSpeed                 : f32,
  wavesAmount                : f32,

  // --- Feature flags - 0=disabled, 1=enabled
  enabledFlow                : u32,
  enabledFoam                : u32,
  enabledSunSpecular         : u32,
  // %SSREFL: screen space reflections blended over the env reflection by RealtimeReflMul
  enabledSsrefl              : u32,
  realtimeReflMul            : f32,
};

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
// @block global
// @private
@group(0) @binding(4) var envMap                 : texture_cube<f32>;

@group(1) @binding(0) var<storage, read> object  : array<ObjectBlock>; // per instance data

// @block view
// @unfilterable
@group(1) @binding(4) var sceneDepthMap         : texture_2d<f32>;
// @block view
@group(1) @binding(5) var sceneColorMap          : texture_2d<f32>;
// @block view
// @unfilterable
@group(1) @binding(6) var hiZMap                : texture_2d<f32>;
// @block view
@group(1) @binding(7) var previousSceneColorMap  : texture_2d<f32>;

${SSR_MATERIAL_WGSL}

@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear          : sampler;
@group(2) @binding(2) var samplerClamp           : sampler;
@group(2) @binding(3) var foamMap                : texture_2d<f32>;

struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3f,
  @location(1) color   : vec4f,
  @location(2) texture : vec2f,
  @location(3) normal  : vec3f,
  @location(4) tangent : vec4f,
  @location(5) fade    : vec4f,
};

struct Varyings {
  @builtin(position) position : vec4f,
  @location(0) worldPos       : vec3f,
  // xy = low frequency, zw = detail bump layer
  @location(1) baseTC         : vec4f,
  // rgb = fog color, a = fog density
  @location(2) fog            : vec4f,
  // distances to start, end, left and right bank over their fade distances
  @location(3) fade           : vec4f,
};

@vertex
fn vsMain(input: VertexInput) -> Varyings {
  let modelMatrix = object[input.id].modelMatrix;
  let worldPos    = modelMatrix * vec4f(input.position, 1.0);

  var out: Varyings;
  out.position = view.projectionMatrix * view.viewMatrix * worldPos;
  out.worldPos = worldPos.xyz;

  // Output bump layers texture coordinates
  var baseTC = input.texture.xyxy * vec4f(1.0, 1.0, 2.0, 2.0) * material.tiling;
  if (material.enabledFlow == TRUE) {
    // moves along uvs (PerView_AnimGenParams.z is the time)
    baseTC += material.waterFlowSpeed * frame.elapsedTime * vec4f(0.25, 0.0, 1.0, 0.0);
  }
  out.baseTC = vec4f(baseTC.xy, baseTC.zw * material.detailTiling);
  out.fog    = input.color;
  out.fade   = input.fade;
  return out;
}

@fragment
fn fsMain(in: Varyings) -> FragmentOutput {
  let mat     = material;
  let timeSec = frame.elapsedTime;
  // global.sunDirection points away from the sun, PerFrame_SunDirection of the original towards it
  let sunDir  = -normalize(global.sunDirection);

  let toEye = view.cameraPosition - in.worldPos;
  let dist  = length(toEye);
  let vView = toEye / dist;
  let side  = select(-1.0, 1.0, toEye.z >= 0.0); // -1 when looking from below the surface

  // ── Normal ────────────────────────────────────────────────
  let footprint       = uvFootprint(in.baseTC.xy);
  let footprintDetail = uvFootprint(in.baseTC.zw);
  let vParalaxOffset  = getParalaxOffset(in.baseTC, footprint, vView, timeSec);
  let cGlossMap       = vec4f(1.0);
  let vNormal         = bumpGen(in.baseTC, footprint, footprintDetail, vParalaxOffset, timeSec);

  // internal reflections from below the surface as well
  let fNdotE = dot(vView, vNormal) * side;

  // ── Water edge softness ───────────────────────────────────
  let screenSize    = vec2f(textureDimensions(sceneDepthMap, 0));
  let screenUv      = in.position.xy / screenSize;
  let surfaceDepth  = linearizeDepthReversedZ(in.position.z, view.near, view.far);
  let sceneDepth    = loadSceneDepth(screenUv);
  let softIntersect = saturate(mat.softIntersectionFactor * (sceneDepth - surfaceDepth));

  // ── Refraction ────────────────────────────────────────────
  const REFRACTION_BUMP_SCALE = 0.1;
  // refraction depth scale (screenProj.z in WaterVS)
  let refrScale = saturate(1.0 - sqrt(saturate(0.02 * surfaceDepth)));
  let refrTC    = vNormal.xy * REFRACTION_BUMP_SCALE * softIntersect * refrScale;
  let depthRefr = loadSceneDepth(clampScreenUv(screenUv + refrTC));
  // do not refract objects in front of the water surface
  let refrMask  = select(0.0, 1.0, surfaceDepth < depthRefr);
  let fFogDepth = mix(sceneDepth, depthRefr, refrMask);
  let refractColorWithFog = sampleSceneColor(screenUv + refrTC * refrMask);

  // the scene behind was fogged by the fog pass: remove the in-scattering up to the water surface, the same fog is
  // applied to the final color
  var refractColor = refractColorWithFog;
  var sceneFog = vec4f(0.0, 0.0, 0.0, 1.0);
  if (global.skipFog == 0u) {
    sceneFog = getSceneFog(in.worldPos);
    refractColor = max(refractColor - sceneFog.rgb, vec3f(0.0));
  }

  // ── Reflection ────────────────────────────────────────────
  const REFLECTION_BUMP_SCALE = 0.3;
  let vReflN = normalize(mix(vec3f(0.0, 0.0, 1.0), vNormal, REFLECTION_BUMP_SCALE));
  let vRefl  = reflect(-vView, vReflN);
  let gloss  = mat.specularColor.w * cGlossMap.x;
  var cSpecularAcc = mat.specularColor.rgb * getReflectColor(envMap, samplerLinear, vRefl, gloss) * mat.envCubeReflMul;
  // %SSREFL: the result replaces the env reflection by its confidence, lerp(env, ssr * RealtimeReflMul, a)
  // (waterreflectionspass.cfi:976). The game traces the flat normal into a reflection texture and distorts the lookup
  // of that texture by the bump, so hit shapes and their edges against the env reflection ripple with the waves.
  // Inline there is no neighbor result to look up: the ray of the bumped reflection normal is traced instead (the env
  // reflection's vReflN), hit, edge and color all follow the waves.
  // Weighted once like the installed shader (ssr * a + (1 - a) * fallback), waterreflectionspass.cfi weights it twice.
  if (mat.enabledSsrefl == TRUE && side > 0.0) {
    let hit = ssrWaterTrace(in.worldPos, vRefl, vReflN);
    if (hit.z > 0.0) {
      let ssrColor = ssrMaterialColor(in.worldPos, hit, gloss, vec2f(0.0), samplerClamp);
      cSpecularAcc = mix(cSpecularAcc, ssrColor * mat.realtimeReflMul, hit.z);
    }
  }

  // ── Volume fog ────────────────────────────────────────────
  // cFogColorDensity: fog color, multiplied with the sun color unless the density is negative
  // (FogColorAffectedBySun = false), density in base 2
  let fogAffectedBySun = in.fog.a >= 0.0;
  let fogColor     = select(in.fog.rgb, in.fog.rgb * global.sunColor.rgb, fogAffectedBySun);
  let fogDensity   = abs(in.fog.a) * 1.44269502;
  let volumeDepth  = max(fFogDepth - surfaceDepth, 0.0);
  // view depth to the length along the view ray
  let volumeLength = volumeDepth * dist / max(surfaceDepth, 1e-3);
  let waterVolumeFog = exp2(-fogDensity * volumeLength);
  refractColor = mix(fogColor, refractColor, saturate(waterVolumeFog));

  // ── Sun specular ──────────────────────────────────────────
  let fNdotL = dot(vNormal, sunDir);
  if (mat.enabledSunSpecular == TRUE) {
    cSpecularAcc += sunSpecular(saturate(fNdotL), vNormal, vView, sunDir, cGlossMap.x);
  }

  // ── Compose ───────────────────────────────────────────────
  const FRESNEL_BIAS = 0.05;
  let fFresnel = getFresnel(fNdotE, FRESNEL_BIAS, 5.0);

  // world soft intersection * camera soft intersection
  let fCameraSoftIsec = saturate(surfaceDepth - 0.33);
  let fA = softIntersect * fCameraSoftIsec;

  var cFinal = mix(refractColor, cSpecularAcc, fFresnel * fA);

  if (mat.enabledFoam == TRUE) {
    let cFoamThreshold = cGlossMap * 2.0 - 1.0; // reuse gloss for masking edges
    var cFoam = textureSample(foamMap, samplerLinear, in.baseTC.xy * mat.foamTiling + vNormal.xy * 0.1).x;
    let fFoamSoftIntersect = saturate(mat.foamSoftIntersectionFactor * (sceneDepth - surfaceDepth));

    // Blend out edges in interesting way
    cFoam = cFoam * saturate(-fFoamSoftIntersect * (1.0 + cFoamThreshold.x) + cFoam);
    cFoam = cFoam * saturate(fFoamSoftIntersect - fFoamSoftIntersect * fFoamSoftIntersect);

    cFinal += cFoam * global.sunColor.rgb * saturate(fNdotL) * saturate(mat.foamAmount);
  }

  var out: FragmentOutput;
  let fogged = cFinal * sceneFog.a + sceneFog.rgb;
  // soft transition between water and opaques
  let fade = saturate(min(min(in.fade.x, in.fade.y), min(in.fade.z, in.fade.w)));
  out.color = vec4f(mix(refractColorWithFog, fogged, fA), fade);
  out.depth = surfaceDepth;

  let debug = global.debug;
  if (debug == DEBUG_GV_NORMAL || debug == DEBUG_GV_SHADE_NORMAL) {
    out.color = vec4f(vNormal * 0.5 + 0.5, 1.0);
  }
  return out;
}

// ── Scene helpers ─────────────────────────────────────────────

fn clampScreenUv(uv: vec2f) -> vec2f {
  return clamp(uv, vec2f(0.0), vec2f(1.0));
}

// linear scene depth, the sky (cleared to 0) is treated as far plane
fn loadSceneDepth(uv: vec2f) -> f32 {
  let dims  = vec2f(textureDimensions(sceneDepthMap, 0));
  let px    = vec2i(clamp(uv * dims, vec2f(0.0), dims - 1.0));
  let depth = textureLoad(sceneDepthMap, px, 0).r;
  return select(depth, view.far, depth <= 0.0);
}

fn sampleSceneColor(uv: vec2f) -> vec3f {
  return textureSampleLevel(sceneColorMap, samplerClamp, clampScreenUv(uv), 0.0).rgb;
}

fn uvFootprint(uv: vec2f) -> f32 {
  return max(length(dpdx(uv)), length(dpdy(uv)));
}

fn getFresnel(NdotI: f32, bias: f32, power: f32) -> f32 {
  let facing = 1.0 - NdotI;
  return saturate(bias + (1.0 - bias) * pow(saturate(facing), power));
}

// two specular lobes, see SunSpecular in watervolume.cfx
fn sunSpecular(fNdotL: f32, vNormal: vec3f, vView: vec3f, sunDir: vec3f, glossMap: f32) -> vec3f {
  let gloss = material.specularColor.w * 255.0 * glossMap;
  let k0 = 4.0 * gloss;
  let k1 = 0.5 * gloss;
  let n0 = k0 * ONE_OVER_TWO_PI + ONE_OVER_PI;
  let n1 = k1 * ONE_OVER_TWO_PI + ONE_OVER_PI;

  let R     = reflect(-vView, vNormal);
  let LdotR = saturate(dot(sunDir, R));
  let fSpec = n0 * pow(LdotR, k0) + n1 * pow(LdotR, k1);

  // IN.cSpecular = PerMaterial_SpecularColor * PerFrame_SunColor.xyz * PerFrame_SunColor.w
  let cSpecular = material.specularColor.xyz * global.sunColor.xyz * global.sunColor.w;
  return fNdotL * fSpec * cSpecular;
}

// ── Water normals ─────────────────────────────────────────────

fn waterDDN(uv: vec2f, footprint: f32, timeSec: f32) -> vec4f {
  return waterDDNWaves(uv, footprint, timeSec, 0.6 * material.wavesSpeed, material.wavesAmount);
}

fn getParalaxOffset(baseTC: vec4f, footprint: f32, vView: vec3f, timeSec: f32) -> vec2f {
  let tcBaseVectorized = baseTC.xyxy * vec4f(0.25, 0.25, 1.0, 1.0);

  const GRADIENT_SCALE = 0.15;
  const HEIGHT_SCALE   = 0.1;

  // Compute the height at this location
  var height = waterDDN(tcBaseVectorized.xy, footprint * 0.25, timeSec);
  var vParalax = vView.xy * (HEIGHT_SCALE * height.w) + GRADIENT_SCALE * height.xy;

  // Compute the height at the offset location
  height = waterDDN(tcBaseVectorized.zw + vParalax, footprint, timeSec);
  vParalax += vView.xy * (HEIGHT_SCALE * height.w) + GRADIENT_SCALE * height.xy;

  return vParalax;
}

fn bumpGen(baseTC: vec4f, footprint: f32, footprintDetail: f32, vParalaxOffset: vec2f, timeSec: f32) -> vec3f {
  // hi frequency
  let tcDetailBase = baseTC.zw + vParalaxOffset;
  // low frequency
  let tcBase0 = baseTC.xyxy * vec4f(0.25, 0.25, 1.0, 1.0);

  var bumpNormal = vec3f(waterDDN(tcDetailBase, footprintDetail, timeSec).xy * material.detailNormalsScale, 0.0);
  bumpNormal += waterDDN(tcBase0.xy + vParalaxOffset, footprint * 0.25, timeSec).xyz;
  bumpNormal += waterDDN(tcBase0.zw + vParalaxOffset, footprint, timeSec).xyz;
  bumpNormal = vec3f(bumpNormal.xy * material.normalsScale, bumpNormal.z);
  return normalize(bumpNormal);
}
`
