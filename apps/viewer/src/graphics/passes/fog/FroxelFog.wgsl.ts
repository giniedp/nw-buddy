import { COMMON_WGSL } from '../../../material/common.wgsl'

/**
 * Default screen pixels per froxel in x and y (r_VolumetricFogTexScale of the game: 3440x1440 → 344x144)
 */
export const FROXEL_TILE_SIZE = 10
/**
 * Default depth slices of the froxel volume (r_VolumetricFogTexDepth of the game)
 */
export const FROXEL_DEPTH = 32
/**
 * Workgroup size of the 2D froxel passes (max depth, debug)
 */
export const FROXEL_WORKGROUP_2D = 8
/**
 * Workgroup size of the 3D froxel passes (BLOCK_SIZE_X/Y/Z of volumelighting.cfi)
 */
export const FROXEL_WORKGROUP_3D = 4

/**
 * Debug views of the froxel fog pass (params.debug.x)
 */
export const FroxelDebugModes = ['off', 'maxDepth', 'injected', 'density', 'integrated', 'transmittance'] as const
export type FroxelDebugMode = (typeof FroxelDebugModes)[number]

/**
 * Shared declarations of the froxel fog passes.
 *
 * The volume is aligned with the view frustum: x/y = screen / FROXEL_TILE_SIZE, z = FROXEL_DEPTH slices from the
 * near plane to the ray-marching range, distributed quadratically (VOLUMETRIC_FOG_SAMPLE_COEFFICIENT 2). Slice i
 * covers the view depths [froxelLinearDepth(i - 1), froxelLinearDepth(i)] (volumelighting.cfi).
 */
const FROXEL_COMMON_WGSL = /* wgsl */ `
${COMMON_WGSL}

// @private
@group(0) @binding(0) var<uniform> global : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform> view   : ViewBlock;

struct FroxelParams {
  // xyz = volume size in froxels, w = screen pixels per froxel
  size: vec4f,
  // x = near (start of the ray marching), y = range - near, z = 1 / (slices - 1), w = 1 / (range - near)
  depth: vec4f,
  // x = debug mode (FroxelDebugModes), y = debug slice
  debug: vec4f,
  // x = reprojection blend factor (r_VolumetricFogReprojectionBlendFactor, 0 without a history)
  temporal: vec4f,
  // view projection of the previous frame times the NDC to texture coordinate scale-bias (PrevViewProjMatrix)
  prevViewProj: mat4x4f,
};

const FROXEL_SAMPLE_COEFFICIENT = 2.0;

// view depth at the back of slice index (GetVolumetricFogLinearDepth)
fn froxelLinearDepth(index: f32) -> f32 {
  return froxel.depth.y * pow(saturate(index * froxel.depth.z), FROXEL_SAMPLE_COEFFICIENT) + froxel.depth.x;
}

// slice texture coordinate (0..1 over the volume depth) of a view depth (GetVolumetricFogDepthTexcoord)
fn froxelDepthTexcoord(linearDepth: f32) -> f32 {
  let d = pow(max(linearDepth - froxel.depth.x, 0.0) * froxel.depth.w, 1.0 / FROXEL_SAMPLE_COEFFICIENT);
  // index (slices - 1) * d at the back of a slice, sampled at its texel center
  let slices = froxel.size.z;
  return ((slices - 1.0) * d + 0.5) / slices;
}

// screen pixel position of a froxel center
fn froxelScreenPos(xy: vec2f) -> vec2f {
  return (xy + 0.5) * froxel.size.w;
}

// camera vector of a froxel column with unit linear depth: d * eyeRay is the point at linear depth d
fn froxelEyeRay(xy: vec2u) -> vec3f {
  let camVec = farPlaneWorldPos(froxelScreenPos(vec2f(xy))) - view.cameraPosition;
  return camVec / dot(view.cameraDirection, camVec);
}
`

/**
 * Maximum linear depth per froxel column (StoreDownscaledMaxDepth), from the full resolution linear depth.
 * Sky pixels hold the far plane.
 */
export const FROXEL_MAX_DEPTH_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
// @unfilterable
@group(1) @binding(1) var linearDepth : texture_2d<f32>;
@group(1) @binding(2) var outMaxDepth : texture_storage_2d<r32float, write>;

@compute @workgroup_size(${FROXEL_WORKGROUP_2D}, ${FROXEL_WORKGROUP_2D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2u(froxel.size.xy);
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }
  let tile = u32(froxel.size.w);
  let depthSize = vec2i(textureDimensions(linearDepth));
  let origin = vec2i(id.xy * tile);
  var maxDepth = 0.0;
  for (var y = 0u; y < tile; y++) {
    for (var x = 0u; x < tile; x++) {
      let p = min(origin + vec2i(i32(x), i32(y)), depthSize - 1);
      maxDepth = max(maxDepth, textureLoad(linearDepth, p, 0).r);
    }
  }
  textureStore(outMaxDepth, vec2i(id.xy), vec4f(maxDepth, 0.0, 0.0, 0.0));
}
`

/**
 * Density and in-scattering injection, one froxel per invocation. Merges the game's InjectFogDensityCS and
 * InjectVolumetricInscatteringCS (volumelighting.cfi), the RGBA16F path: rgb = in-scattering times the fog colors
 * (inscatterByFogColor), a = density of the global height fog plus the fog volumes.
 *
 * Global height fog, fog volumes, sun (unshadowed until phase 9), the global probe and the cluster lights. The sample
 * position inside a froxel is jittered per frame, the blur and the temporal reprojection average it out.
 */
export const FROXEL_INJECT_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}

// @private
@group(0) @binding(2) var<uniform> frame : FrameBlock;

// the octave of the jitter while the reprojection is on (InjectFogDensityParams.z, SunColor.w)
const FROXEL_JITTER_OCTAVE = -1.7;

// GetJitterInternal with the temporal offset octave * PerView_AnimGenParams.z (time) * (1, 0.5): interleaved
// gradient noise per froxel column, shifted every frame
fn froxelJitter(xy: vec2u) -> f32 {
  let n = vec2f(xy) + FROXEL_JITTER_OCTAVE * frame.elapsedTime * vec2f(1.0, 0.5);
  return fract(52.9829189 * fract(dot(n, vec2f(0.06711056, 0.00583715))));
}

// @block global
// @private
@group(0) @binding(12) var probeDiffuseCubes : texture_cube_array<f32>;

// packed by the FogVolumeSystem (CVolumetricFog::PrepareFogVolumeList, SFogVolumeInjectInfo)
struct FogVolume {
  worldToObj: mat4x4f,
  // xyz = center, w = type (0 ellipsoid, 1 box)
  center    : vec4f,
  // xyz = eye position in object space, w = 1 / soft edge lerp
  eyePosOS  : vec4f,
  // rgb = fog color, w = global density
  color     : vec4f,
  // xyz = height falloff base point, w = density offset
  heightBase: vec4f,
  // xyz = height falloff direction times scale, w = noise scale (normalized)
  heightDir : vec4f,
  // x = 1 / ramp distance, y = -ramp start / ramp distance, z = ramp influence, w = 1 - ramp influence
  ramp      : vec4f,
  // xyz = wind offset, w = noise offset
  wind      : vec4f,
  // xyz = noise spatial frequency, w = noise elapsed time
  noise     : vec4f,
};

// Forward+ clusters of the LightSystem, the froxels look up the cluster of their sample position
// @private
@group(0) @binding(3) var<uniform> lights : LightBlock;

// packed fog volumes, the first global.fogVolumeCount are valid
// @block global
// @private
@group(0) @binding(15) var<storage, read> fogVolumes : array<FogVolume>;

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
// @unfilterable
@group(1) @binding(1) var maxDepthMap : texture_2d<f32>;
@group(1) @binding(2) var outVolume : texture_storage_3d<rgba16float, write>;
@group(1) @binding(3) var noiseMap : texture_2d<f32>;
@group(1) @binding(4) var noiseSampler : sampler;

// ENABLE_MAX_DEPTH_AWARE_INJECTION
const EARLY_REJECTION_LENGTH = 6.0;
const EARLY_REJECTION_VOXELS = 2.0;
const WIND_OFFSET_SPAN = 1000.0;

// GetExponentialHeightFogDensity
fn froxelHeightFogDensity(cameraToWorldPos: vec3f, linearDepth: f32) -> f32 {
  let fogDensityAtCamera = global.volFog2HeightDensity.y / 1.44269502;
  let fogDensityDifference = exp(global.volFog2HeightDensity.x * cameraToWorldPos.z);
  var density = saturate(fogDensityAtCamera * fogDensityDifference);
  density *= 1.0 - volFog2ZenithFade(global.volFog2Zenith.x, global.volFog2Zenith.y, cameraToWorldPos.z / linearDepth);
  // depth based ramp
  let r = saturate(linearDepth * global.volFog2Ramp.z - global.volFog2Ramp.w);
  return density * r;
}

// vfGetSmoothNoise: 4D value noise from a 64² random texture
fn froxelSmoothNoise(v: vec4f) -> f32 {
  let i = floor(v);
  var f = fract(v);
  f = vec4f(f.xyz * f.xyz * (-2.0 * f.xyz + 3.0), f.w);
  var uv = ((i.xy + vec2f(7.0, 17.0) * i.z) + vec2f(89.0, 113.0) * i.w) + f.xy;
  var lowz = textureSampleLevel(noiseMap, noiseSampler, (uv + 0.5) / 64.0, 0.0).x;
  uv += vec2f(7.0, 17.0);
  var highz = textureSampleLevel(noiseMap, noiseSampler, (uv + 0.5) / 64.0, 0.0).x;
  var r0 = mix(lowz, highz, f.z);
  uv += vec2f(89.0, 113.0);
  highz = textureSampleLevel(noiseMap, noiseSampler, (uv + 0.5) / 64.0, 0.0).x;
  uv -= vec2f(7.0, 17.0);
  lowz = textureSampleLevel(noiseMap, noiseSampler, (uv + 0.5) / 64.0, 0.0).x;
  var r1 = mix(lowz, highz, f.z);
  uv += vec2f(89.0, 113.0);
  lowz = textureSampleLevel(noiseMap, noiseSampler, (uv + 0.5) / 64.0, 0.0).x;
  uv += vec2f(7.0, 17.0);
  highz = textureSampleLevel(noiseMap, noiseSampler, (uv + 0.5) / 64.0, 0.0).x;
  let r2 = mix(lowz, highz, f.z);
  r0 = (r0 + r1) * 0.5;
  r1 = (r1 + r2) * 0.5;
  return 2.0 * mix(r0, r1, f.w) - 1.0;
}

// vfGetDensityNoise
fn froxelDensityNoise(worldPos: vec3f, noiseScale: f32, noiseOffset: f32, elapsed: f32, frequency: vec3f) -> f32 {
  var noise = 0.0;
  if ((-1.5 * noiseScale + noiseOffset) < 1.0) {
    // HLSL fmod keeps the sign of the dividend
    let p = (worldPos - WIND_OFFSET_SPAN * trunc(worldPos / WIND_OFFSET_SPAN)) * frequency;
    var q = vec4f(p, elapsed);
    var v = froxelSmoothNoise(q);
    q *= 3.07;
    v += 0.5 * froxelSmoothNoise(q);
    noise = noiseScale * v;
  }
  return saturate(noise + noiseOffset);
}

// vfGetVolumeAttenuation
fn froxelVolumeAttenuation(L: vec3f, invFalloffMax: f32) -> f32 {
  var falloff = saturate(1.0 + dot(L, -L));
  falloff = saturate(falloff * invFalloffMax);
  return falloff * falloff * (3.0 - 2.0 * falloff);
}

// MapCubeToSphere
fn froxelCubeToSphere(pos: vec3f) -> vec3f {
  let pos2 = pos * pos;
  return pos * sqrt(1.0 - 0.5 * pos2.yzx - 0.5 * pos2.zxy + 0.333 * pos2.yzx * pos2.zxy);
}

struct FroxelDensity {
  density: f32,
  color  : vec3f,
};

// AccumulateDensityFogVolume, all volumes (no tile culling, the viewer has few at once)
fn froxelFogVolumes(eyeRay: vec3f, depth: f32, depthFront: f32, jitter: f32) -> FroxelDensity {
  var result: FroxelDensity;
  result.density = 0.0;
  result.color = vec3f(0.0);
  let invDist = select(0.0, 1.0 / (depth - depthFront), depth - depthFront > 0.000001);
  let count = global.fogVolumeCount;
  for (var i = 0u; i < count; i++) {
    let fv = fogVolumes[i];
    let worldToObj = mat3x3f(fv.worldToObj[0].xyz, fv.worldToObj[1].xyz, fv.worldToObj[2].xyz);
    var dirOS = worldToObj * eyeRay;
    let invScaledLength = inverseSqrt(dot(dirOS, dirOS));
    dirOS *= invScaledLength;
    let eyeOS = fv.eyePosOS.xyz;
    var tS = 0.0;
    var tE = 0.0;
    var hit = true;
    if (fv.center.w < 0.5) {
      // ellipsoid: unit sphere in object space
      let B = dot(eyeOS, dirOS);
      let C = dot(eyeOS, eyeOS) - 1.0;
      let discr = B * B - C;
      hit = discr >= 0.0;
      let s = sqrt(max(discr, 0.0));
      tS = max(0.0, -B - s);
      tE = max(0.0, -B + s);
    } else {
      // box: unit cube in object space
      let invDir = 1.0 / dirOS;
      let tPos = (1.0 - eyeOS) * invDir;
      let tNeg = (-1.0 - eyeOS) * invDir;
      let tFront = clamp(select(tPos, tNeg, dirOS > vec3f(0.0)), vec3f(-1e7), vec3f(1e7));
      let tBack = clamp(select(tNeg, tPos, dirOS > vec3f(0.0)), vec3f(-1e7), vec3f(1e7));
      tS = max(0.0, max(tFront.x, max(tFront.y, tFront.z)));
      tE = max(0.0, min(tBack.x, min(tBack.y, tBack.z)));
    }
    // object space ray length to linear depth: eyeRay has unit linear depth
    tS *= invScaledLength;
    tE *= invScaledLength;
    if (!hit || tE < depthFront || depth < tS) {
      continue;
    }
    tS = clamp(tS, depthFront, depth);
    tE = clamp(tE, depthFront, depth);
    let coverage = saturate((tE - tS) * invDist);
    let linearDepth = mix(tS, tE, jitter);
    let position = linearDepth * eyeRay + view.cameraPosition;

    let densityNoise = froxelDensityNoise(position + fv.wind.xyz, fv.heightDir.w, fv.wind.w, fv.noise.w, fv.noise.xyz);
    var fogInt = exp(-dot(position - fv.heightBase.xyz, fv.heightDir.xyz));
    // soft edges
    var dirFromCenter = worldToObj * (fv.center.xyz - position);
    if (fv.center.w >= 0.5) {
      dirFromCenter = froxelCubeToSphere(dirFromCenter);
    }
    fogInt = saturate(fogInt * froxelVolumeAttenuation(dirFromCenter, fv.eyePosOS.w));
    fogInt = saturate(densityNoise * fv.color.w * (fogInt - fv.heightBase.w));
    // depth based ramp
    var r = saturate(linearDepth * fv.ramp.x + fv.ramp.y);
    r = r * (2.0 - r);
    r = r * fv.ramp.z + fv.ramp.w;
    fogInt *= r * coverage;
    result.density += fogInt;
    result.color += fv.color.rgb * fogInt;
  }
  return result;
}

// isotropic in-scattering of the global probe (a TILEDLIGHT_TYPE_PROBE of the light list in the game), diffuse cube
// along the eye ray times the probe color, without the entities albedo
fn froxelProbeInscatter(eyeRay: vec3f) -> vec3f {
  if (global.volFog2Probe.w <= 0.0) {
    // without a baked probe the stand-in of the analytical fog (it includes the entities albedo)
    return global.volFog2Ambient.rgb / max(global.volFog2Entity.rgb, vec3f(0.001));
  }
  let cube = textureSampleLevel(probeDiffuseCubes, noiseSampler, eyeRay, i32(global.probeGlobal.x), 0.0).rgb;
  return cube * global.probeDiffuseColor.rgb / (4.0 * PI);
}

// r_VolumetricFogMinimumLightBulbSize: larger bulbs in the fog reduce the flicker of small lights
const FROXEL_MIN_BULB_SIZE = 0.4;
// start of the fade towards the light range, as a fraction of the range (see froxelLightAttenuation)
const FROXEL_LIGHT_FADE_START = 0.5;

// getPhysicalLightAttenuation with a smooth fade over the outer half of the range instead of the squared fade over
// the last 20%: the kink where that fade starts shows as the edge of the light's sphere in bright fog (viewer only,
// surfaces keep the game's fade)
fn froxelLightAttenuation(dist: f32, range: f32, bulb: f32) -> f32 {
  let fade = 1.0 - smoothstep(range * FROXEL_LIGHT_FADE_START, range, dist);
  let d = max(dist - bulb, 0.0);
  let denom = 1.0 + d / bulb;
  return fade / (denom * denom);
}

// AccumulateInscatteringRegularLights for the cluster lights with LIGHT_FLAG_FOG, on top of the probe in-scattering:
// ambient lights multiply the in-scattering so far, regular lights (point, projector, area as point) add the
// Schlick lobe with the anisotropy of the entities (fog radial lobe 0). The light color already carries the
// surface brightness (1 + 1 / bulb)² (LightSystem), the fog list of Lumberyard uses the bulb clamped to
// FROXEL_MIN_BULB_SIZE instead, hence the ratio of the two terms.
fn froxelClusterLights(position: vec3f, normalizedEyeRay: vec3f, probeInscatter: vec3f) -> vec3f {
  var inscatter = probeInscatter;
  let clusterIndex = getLightClusterIndex(lights, position);
  if (clusterIndex < 0) {
    return inscatter;
  }
  let cluster = lightClusters[clusterIndex];
  let k = global.volFog2Entity.w;
  for (var i = 0u; i < cluster.count; i++) {
    let light = lightList[lightIndices[cluster.offset + i].light];
    if (!lightHasFlag(light, LIGHT_FLAG_FOG)) {
      continue;
    }
    let baseType = u32(light.direction.w) % LIGHT_TYPE_AMBIENT;
    if (lightIsAmbient(light)) {
      // ambient lights: point and area attenuation squared, projectors use the cone (no projector texture)
      let result = getClusterLight(light, position, vec3f(0.0));
      var attenuation = result.falloff;
      if (baseType != LIGHT_TYPE_SPOT) {
        attenuation *= attenuation;
      }
      var NdotL = 1.0;
      if (baseType == LIGHT_TYPE_AREA) {
        NdotL = saturate(dot(-result.direction, light.direction.xyz));
      }
      inscatter *= mix(vec3f(1.0), light.color.rgb, attenuation * NdotL);
      continue;
    }
    let toLight = light.position.xyz - position;
    let dist = length(toLight);
    let range = max(light.position.w, 0.0001);
    if (dist >= range) {
      continue;
    }
    let bulb = max(light.tangent.w, 0.001);
    let fogBulb = max(bulb, FROXEL_MIN_BULB_SIZE);
    let brightness = (1.0 + 1.0 / fogBulb) / (1.0 + 1.0 / bulb);
    var falloff = froxelLightAttenuation(dist, range, fogBulb);
    let L = toLight / max(dist, 1e-5);
    if (baseType == LIGHT_TYPE_SPOT) {
      // the projector texture of the game stands in as the cone
      falloff *= smoothstep(light.params.z, light.params.w, dot(-L, light.direction.xyz));
    }
    let phase = volFog2SchlickPhase(dot(L, normalizedEyeRay), k, 1.0 - k * k);
    inscatter += light.color.rgb * (brightness * brightness * falloff * phase);
  }
  return inscatter;
}

@compute @workgroup_size(${FROXEL_WORKGROUP_3D}, ${FROXEL_WORKGROUP_3D}, ${FROXEL_WORKGROUP_3D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec3u(froxel.size.xyz);
  if (any(id >= size)) {
    return;
  }
  let eyeRay = froxelEyeRay(id.xy);
  let normalizedEyeRay = normalize(eyeRay);

  let depthIndex = f32(id.z);
  var depth = froxelLinearDepth(depthIndex);
  let depthFront = froxelLinearDepth(depthIndex - 1.0);
  let maxDepth = textureLoad(maxDepthMap, vec2i(id.xy), 0).r;
  let jitter = froxelJitter(id.xy);

  var density = 0.0;
  var inscatter = vec3f(0.0);
  // early rejection behind the max depth of the column
  let earlyRejectDepth = min(froxelLinearDepth(depthIndex - 1.0 - EARLY_REJECTION_VOXELS), depthFront - EARLY_REJECTION_LENGTH);
  if (earlyRejectDepth < maxDepth) {
    // no fog behind the max depth inside the voxel
    if (depthFront < maxDepth && maxDepth <= depth) {
      depth = maxDepth;
    }
    let d = mix(depthFront, depth, jitter);
    let globalDensity = froxelHeightFogDensity(d * eyeRay, depth);
    let local = froxelFogVolumes(eyeRay, depth, depthFront, jitter);
    density = globalDensity + local.density;

    // CombineInscatteringSunAndRegularLights, sun shadow = 1 until the sun shadows (phase 9)
    let shadowSun = 1.0;
    let regularLights = froxelClusterLights(view.cameraPosition + d * eyeRay, normalizedEyeRay, froxelProbeInscatter(normalizedEyeRay));
    // global.sunDirection points away from the light
    let dotLE = dot(-global.sunDirection, normalizedEyeRay);
    // GetVolumetricFogInscatteringSun: two lobes of the atmosphere and the sun radial
    let ins0 = volFog2SchlickPhase(dotLE, global.volFog2Scattering.z, global.volFog2Scattering.w) * shadowSun * global.fogScatteringColor.rgb;
    let ins1 = volFog2SchlickPhase(dotLE, global.fogScatteringColor.w, global.fogScatteringSecondaryColor.w) * shadowSun * global.fogScatteringSecondaryColor.rgb;
    let sunGlobal = ins0 * (1.0 - global.volFog2Blend.x * global.volFog2Blend.y) + ins1 * global.volFog2Blend.x;
    let inscatterGlobal = globalDensity * (global.volFog2Entity.rgb * regularLights + sunGlobal);
    // sun in-scattering of the fog volumes with the anisotropy of the entities
    let k = global.volFog2Entity.w;
    let sunLocal = volFog2SchlickPhase(dotLE, k, 1.0 - k * k) * shadowSun * global.sunColor.rgb;
    inscatter = (regularLights + sunLocal) * local.color + inscatterGlobal;
  }
  textureStore(outVolume, vec3i(id), vec4f(inscatter, density));
}
`

/**
 * Front-to-back integration over the slices (RaymarchVolumetricFogCS): rgb = accumulated in-scattering,
 * a = transmittance, per slice
 */
export const FROXEL_RAYMARCH_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
@group(1) @binding(1) var injected : texture_3d<f32>;
@group(1) @binding(2) var outVolume : texture_storage_3d<rgba16float, write>;

@compute @workgroup_size(${FROXEL_WORKGROUP_2D}, ${FROXEL_WORKGROUP_2D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec3u(froxel.size.xyz);
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }
  let scatterCoefficient = global.volFog2Scattering.x;
  let extinctionCoefficient = global.volFog2Scattering.y;
  // the slice depths are linear depths, the step along the ray is longer off the view axis
  let farPos = farPlaneWorldPos(froxelScreenPos(vec2f(id.xy)));
  let camVec = farPos - view.cameraPosition;
  let normalizedFactor = 1.0 / dot(view.cameraDirection, normalize(camVec));

  var transmittance = 1.0;
  var inscatter = vec3f(0.0);
  for (var step = 0u; step < size.z; step++) {
    let v = textureLoad(injected, vec3i(vec2i(id.xy), i32(step)), 0);
    let depthFront = froxelLinearDepth(f32(step) - 1.0);
    let depthBack = froxelLinearDepth(f32(step));
    let stepSize = (depthBack - depthFront) * normalizedFactor;
    let S = scatterCoefficient * v.rgb;
    let muE = max(0.000000001, extinctionCoefficient * v.a);
    let trns = exp(-muE * stepSize);
    // integral of the attenuated in-scattering within the voxel
    let Sint = (S - S * trns) / muE;
    inscatter += transmittance * Sint;
    transmittance *= trns;
    textureStore(outVolume, vec3i(vec2i(id.xy), i32(step)), vec4f(inscatter, transmittance));
  }
}
`

// 9 tap binomial weights of BlurHorizontal/VerticalInscatteringVolumeCS
const FROXEL_BLUR_WEIGHTS_WGSL = /* wgsl */ `
const FROXEL_BLUR_WEIGHTS = array<f32, 9>(
  1.0 / 256.0, 8.0 / 256.0, 28.0 / 256.0, 56.0 / 256.0, 70.0 / 256.0, 56.0 / 256.0, 28.0 / 256.0, 8.0 / 256.0, 1.0 / 256.0,
);
`

/**
 * Horizontal blur of the injected volume (BlurHorizontalInscatteringVolumeCS, the RGBA16F path without the max depth
 * aware filtering, which the game has off): 9 taps in x within the slice, clamped at the volume border
 */
export const FROXEL_BLUR_H_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}
${FROXEL_BLUR_WEIGHTS_WGSL}

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
@group(1) @binding(1) var source : texture_3d<f32>;
@group(1) @binding(2) var outVolume : texture_storage_3d<rgba16float, write>;

@compute @workgroup_size(${FROXEL_WORKGROUP_2D}, ${FROXEL_WORKGROUP_2D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec3i(froxel.size.xyz);
  let p = vec3i(id);
  if (any(p >= size)) {
    return;
  }
  var value = vec4f(0.0);
  for (var i = -4; i <= 4; i++) {
    let x = clamp(p.x + i, 0, size.x - 1);
    value += FROXEL_BLUR_WEIGHTS[i + 4] * textureLoad(source, vec3i(x, p.y, p.z), 0);
  }
  textureStore(outVolume, p, value);
}
`

/**
 * Vertical blur (BlurVerticalInscatteringVolumeCS): 9 taps in y, sampled trilinearly at the depth texcoord
 * slice / slices, which blends the slice with the one in front of it like the game ("set offset to zero to blend
 * two slices")
 */
export const FROXEL_BLUR_V_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}
${FROXEL_BLUR_WEIGHTS_WGSL}

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
@group(1) @binding(1) var source : texture_3d<f32>;
@group(1) @binding(2) var outVolume : texture_storage_3d<rgba16float, write>;
@group(1) @binding(3) var sourceSampler : sampler;

@compute @workgroup_size(${FROXEL_WORKGROUP_2D}, ${FROXEL_WORKGROUP_2D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec3i(froxel.size.xyz);
  let p = vec3i(id);
  if (any(p >= size)) {
    return;
  }
  let invSize = 1.0 / froxel.size.xy;
  let z = f32(p.z) / froxel.size.z;
  var value = vec4f(0.0);
  for (var i = -4; i <= 4; i++) {
    // the clamp sampler holds the border texel like the clamped load of the game
    let tc = vec3f((vec2f(f32(p.x), f32(p.y + i)) + 0.5) * invSize, z);
    value += FROXEL_BLUR_WEIGHTS[i + 4] * textureSampleLevel(source, sourceSampler, tc, 0.0);
  }
  textureStore(outVolume, p, value);
}
`

/**
 * Temporal reprojection (ReprojectVolumetricFogCS, r_VolumetricFogReprojectionMode 1 = %_RT_SAMPLE5 with
 * ENABLE_5X5_NEIGHBOR_VOXEL_SEARCH): blends the blurred volume of this frame with the history at the position the
 * froxel had in the previous frame. The history is rejected outside the previous frustum, faded at its borders,
 * reduced with the depth velocity and when its luminance leaves the 5x5 neighborhood range of this frame.
 * The output is the history of the next frame.
 */
export const FROXEL_REPROJECT_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
@group(1) @binding(1) var current : texture_3d<f32>;
@group(1) @binding(2) var previous : texture_3d<f32>;
// @unfilterable
@group(1) @binding(3) var maxDepthMap : texture_2d<f32>;
@group(1) @binding(4) var outVolume : texture_storage_3d<rgba16float, write>;
@group(1) @binding(5) var previousSampler : sampler;

fn froxelLuminance(color: vec3f) -> f32 {
  return dot(color, vec3f(0.2126, 0.7152, 0.0722));
}

@compute @workgroup_size(${FROXEL_WORKGROUP_3D}, ${FROXEL_WORKGROUP_3D}, ${FROXEL_WORKGROUP_3D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = vec3i(froxel.size.xyz);
  let p = vec3i(id);
  if (any(p >= size)) {
    return;
  }
  var value = textureLoad(current, p, 0);
  var blendFactor = froxel.temporal.x;
  if (blendFactor <= 0.0) {
    textureStore(outVolume, p, value);
    return;
  }

  // luminance range of the 5x5 neighborhood within the slice
  var minl = 65504.0;
  var maxl = 0.0;
  for (var y = -2; y <= 2; y++) {
    for (var x = -2; x <= 2; x++) {
      let q = vec3i(clamp(p.xy + vec2i(x, y), vec2i(0), size.xy - 1), p.z);
      let l = froxelLuminance(textureLoad(current, q, 0).rgb);
      minl = min(minl, l);
      maxl = max(maxl, l);
    }
  }

  // the froxel position, restricted to the front of the max depth to reduce light leaking
  let depthIndex = f32(p.z);
  var depth = froxelLinearDepth(depthIndex);
  let depthFront = froxelLinearDepth(depthIndex - 1.0);
  let maxDepth = textureLoad(maxDepthMap, p.xy, 0).r;
  if (depthFront < maxDepth && maxDepth <= depth) {
    depth = maxDepth;
  }
  let worldPos = view.cameraPosition + depth * froxelEyeRay(id.xy);

  // texture coordinate in the previous volume, w of the projection is the linear depth
  let reprojPos = froxel.prevViewProj * vec4f(worldPos, 1.0);
  let tc = vec3f(reprojPos.xy / reprojPos.w, froxelDepthTexcoord(reprojPos.w));

  const halfSizeTC = 0.5;
  const endFadeTC = 0.6;
  const startFadeTC = 0.49;
  const borderLength = endFadeTC - halfSizeTC;
  if (any(tc <= vec3f(-borderLength)) || any(tc >= vec3f(1.0 + borderLength)) || reprojPos.w <= froxel.depth.x) {
    textureStore(outVolume, p, value);
    return;
  }
  // screen uv to volume texcoord: the volume covers ceil(screen / tile) * tile pixels
  let prevTc = vec3f(tc.xy * view.viewportSize / (froxel.size.xy * froxel.size.w), tc.z);
  let prev = textureSampleLevel(previous, previousSampler, prevTc, 0.0);
  // a non finite history would stay: the filtered sampling spreads it over the volume
  if (any((bitcast<vec4u>(prev) & vec4u(0x7f800000u)) == vec4u(0x7f800000u))) {
    textureStore(outVolume, p, value);
    return;
  }

  // fade towards the borders of the previous volume against smearing at the screen edges
  var f = 1.0 - saturate((abs(tc - halfSizeTC) - startFadeTC) / (endFadeTC - startFadeTC));
  f = f * f * (-2.0 * f + 3.0);
  blendFactor *= saturate(f.x * f.y * f.z);

  // depth velocity in volume texture space
  let dt = tc.z - (depthIndex + 0.5) / froxel.size.z;
  let velocityFactor = saturate(exp2(-abs(dt) * 80.0));
  blendFactor *= mix(0.5, 1.0, velocityFactor);

  // luminance similarity among the neighbors: a previous value outside their range is rejected, brighter ones less
  let pl = froxelLuminance(prev.rgb);
  let diff = pl - clamp(pl, minl, maxl);
  let w = select(48.0, -24.0, diff > 0.0);
  var similarityFactor = saturate(exp2(w * diff));
  // and between the current and the previous froxel
  let cl = froxelLuminance(value.rgb);
  similarityFactor = min(similarityFactor, mix(0.6, 1.0, saturate(exp2(-8.0 * abs(pl - cl)))));
  blendFactor *= mix(similarityFactor, 1.0, 0.1);

  value = mix(value, prev, blendFactor);
  textureStore(outVolume, p, value);
}
`

/**
 * Debug view into the HDR color (FroxelDebugModes): the max depth (fraction of the range), one slice of the injected
 * volume (in-scattering, density × 10) or of the integrated volume (in-scattering, transmittance)
 */
export const FROXEL_DEBUG_WGSL = /* wgsl */ `
${FROXEL_COMMON_WGSL}

@group(1) @binding(0) var<uniform> froxel : FroxelParams;
// @unfilterable
@group(1) @binding(1) var maxDepthMap : texture_2d<f32>;
@group(1) @binding(2) var injected : texture_3d<f32>;
@group(1) @binding(3) var integrated : texture_3d<f32>;
@group(1) @binding(4) var outColor : texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${FROXEL_WORKGROUP_2D}, ${FROXEL_WORKGROUP_2D})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let size = textureDimensions(outColor);
  if (id.x >= size.x || id.y >= size.y) {
    return;
  }
  let f = vec2i(vec2f(id.xy) / froxel.size.w);
  let p = vec3i(f, i32(froxel.debug.y));
  var color = vec3f(0.0);
  switch (u32(froxel.debug.x)) {
    case 1u: {
      let d = textureLoad(maxDepthMap, f, 0).r;
      color = vec3f(saturate((d - froxel.depth.x) * froxel.depth.w));
    }
    case 2u: {
      color = textureLoad(injected, p, 0).rgb;
    }
    case 3u: {
      color = vec3f(textureLoad(injected, p, 0).a * 10.0);
    }
    case 4u: {
      color = textureLoad(integrated, p, 0).rgb;
    }
    default: {
      color = vec3f(textureLoad(integrated, p, 0).a);
    }
  }
  textureStore(outColor, vec2i(id.xy), vec4f(color, 1.0));
}
`
