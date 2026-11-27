import { VOLUMETRIC_FOG_2_WGSL } from './volumetricFog2.wgsl'

export const COMMON_WGSL = /* wgsl */ `
${VOLUMETRIC_FOG_2_WGSL}

const TRUE: u32 = 1u;
const FALSE: u32 = 0u;
const LIGHT_TYPE_OFF:         u32 = 0u;
const LIGHT_TYPE_DIRECTIONAL: u32 = 1u;
const LIGHT_TYPE_POINT:       u32 = 2u;
const LIGHT_TYPE_SPOT:        u32 = 3u;
const LIGHT_TYPE_AREA:        u32 = 4u;
// added to the type of ambient only lights, they multiply the ambient lighting (TiledShading.cfi)
const LIGHT_TYPE_AMBIENT:     u32 = 8u;
// flag bits above the type: the light contributes to the froxel fog (DLF_VOLUMETRIC_FOG), only to the fog
const LIGHT_FLAG_FOG:         u32 = 16u;
const LIGHT_FLAG_FOG_ONLY:    u32 = 32u;
// an environment probe (environmentLight), not a light: first in a cluster, in blend order
const LIGHT_FLAG_PROBE:       u32 = 64u;
// gbuffer lighting models (LIGHTINGMODEL_* in the deferred shading)
const LIGHTINGMODEL_STANDARD:      u32 = 0u;
const LIGHTINGMODEL_TRANSMITTANCE: u32 = 1u;
const FLOAT_EPSILON = 1e-10;
const MIN_ROUGHNESS = 0.05;// 0.001;

// #region --- Debug Flags ---
const DEBUG_OFF:                 u32 = 0u;
// Material
const DEBUG_MTL_ALBEDO:          u32 = 1u; // base color
const DEBUG_MTL_SPECULAR:        u32 = 2u;
const DEBUG_MTL_METALLIC:        u32 = 3u;
const DEBUG_MTL_ROUGHNESS:       u32 = 4u;
const DEBUG_MTL_IOR:             u32 = 5u;
const DEBUG_MTL_EMISSIVE:        u32 = 6u;
const DEBUG_MTL_AO:              u32 = 7u; // ambient occlusion
const DEBUG_MTL_OPACITY:         u32 = 8u; // alpha
const DEBUG_MTL_HEIGHT:          u32 = 9u;
const DEBUG_MTL_NOISE:           u32 = 10u;

// Geometry / vectors
const DEBUG_GV_NORMAL:           u32 = 100u;
const DEBUG_GV_TANGENT:          u32 = 101u;
const DEBUG_GV_BITANGENT:        u32 = 102u;
const DEBUG_GV_SHADE_NORMAL:     u32 = 103u;
const DEBUG_GV_POSITION_WS:      u32 = 104u;
const DEBUG_GV_DEPTH:            u32 = 105u;

// Vertex attributes
const DEBUG_V_COLOR0:            u32 = 200u;
const DEBUG_V_COLOR1:            u32 = 201u;
const DEBUG_V_UV0:               u32 = 202u;
const DEBUG_V_UV1:               u32 = 203u;
const DEBUG_V_UV3:               u32 = 204u;
const DEBUG_V_UV4:               u32 = 205u;
const DEBUG_V_UV5:               u32 = 206u;
const DEBUG_V_DEFORM:            u32 = 207u;

// Shading components
const DEBUG_SH_DIFFUSE:          u32 = 300u;
const DEBUG_SH_SPECULAR:         u32 = 301u;
const DEBUG_SH_SHADOW:           u32 = 302u;
const DEBUG_SH_AMBIENT:          u32 = 303u;
const DEBUG_SH_REFLECTION:       u32 = 304u;
const DEBUG_SH_FRESNEL:          u32 = 305u;
const DEBUG_SH_COUNT:            u32 = 306u; // heatmap of overlapping lights/clusters
const DEBUG_SH_SPECULAR_AA:      u32 = 307u; // roughness added by specular antialiasing

// Terrain virtual texture
const DEBUG_VT_MIP:              u32 = 400u; // sampled page mip, red = no page
const DEBUG_VT_NO_MACRO:         u32 = 401u; // virtual texture without macro fallback and fade

// Misc / engine
// const DEBUG_MIP_LEVEL:     u32 = 29u;
// const DEBUG_UV_CHECKER:    u32 = 30u;
// const DEBUG_WIREFRAME:     u32 = 31u;
// const DEBUG_OVERDRAW:      u32 = 32u;
// const DEBUG_LOD:           u32 = 33u;
// const DEBUG_MOTION_VECTORS:u32 = 34u;
// const DEBUG_INSTANCE_ID:   u32 = 35u;
// const DEBUG_MATERIAL_ID:   u32 = 36u;
// #endregion

// #region --- Feature toggles ---
  override ADVANCED = false;
  override ALLOW_SILHOUETTE_POM = false;
  override ALLOW_SPECULAR_ANTIALIASING = false;
  override ALLOW_TESSELATION = false;
  override ALPHAMASK_DETAILMAP = false;
  override ANISO_SPECULAR = false;
  override APPLY_FOG_COLOR = false;
  override APPLY_SUN_COLOR = false;
  override BILINEAR_FP16 = false;
  override BLENDLAYER = false;
  override BLENDLAYER_UV_SET_2 = false;
  override BLUR_REFRACTION = false;
  override BUMP_MAP = false;
  override COLOR_LOOKUP = false;
  override COLOR_SAMPLER_OVERLAY_MASK = false;
  override DECAL = false;
  override DECAL_MAP = false;
  override DEFORMATION = false;
  override DEPTH_FIXUP = false;
  override DEPTH_FOG = false;
  override DETAIL_BENDING = false;
  override DETAIL_MAPPING = false;
  override DIFFUSE_MAP_2 = false;
  override DIFFUSE_MAP_3 = false;
  override DIFFUSE_MAP_4 = false;
  override DIRECTION_MAP = false;
  override DIRT_MAP = false;
  override DIRTLAYER = false;
  override DISPLACEMENT_MAPPING = false;
  override EMISSIVE_DECAL = false;
  override EMITTANCE_MAP = false;
  override EMITTANCE_MAP_UV_SET_2 = false;
  override ENABLE_FADEOUT = false;
  override ENFORCE_TILED_SHADING = false;
  override ENVIRONMENT_MAP = false;
  override FLOW = false;
  override FLOW_MAP = false;
  override FOAM = false;
  override FX_ADVANCED_SS = false;
  override FX_DISSOLVE = false;
  override FX_SS_CUSTOM_DIR = false;
  override GLOW_FRESNEL = false;
  override GLOW_MAP = false;
  override GRADIENT_ALPHA = false;
  override GRASS = false;
  override HAIR_PASS = false;
  override HAS_DECAL_LAYERS = false;
  override IS_GDE_IMPOSTOR = false;
  override IS_POI_IMPOSTOR = false;
  override LEAVES = false;
  override LOCAL_WEATHER = false;
  override NOISE = false;
  override NORMAL_MAP = false;
  override OCCLUSION_MAP = false;
  override OFFSET_BUMP_MAPPING = false;
  override OVERLAY_MASK = false;
  override PARALLAX_OCCLUSION_MAPPING = false;
  override PHONG_TESSELLATION = false;
  override PN_TESSELLATION = false;
  override RECEIVE_SHADOWS = false;
  override REFRACTION = false;
  override REFRACTION_TINTING = false;
  override RIM_BLEND = false;
  override RIM_DIFFUSE_LIGHTING = false;
  override RIM_SPEC_LIGHTING = false;
  override SAA_FILTERING = false;
  override SCREEN_SPACE_DEFORMATION = false;
  override SIGNED_DISTANCE_FIELD_2D = false;
  override SILHOUETTE_PARALLAX_OCCLUSION_MAPPING = false;
  override SIMPLE = false;
  override SOFT_PARTICLE = false;
  override SOLID_HAIR = false;
  override SPEC_MAP = false;
  override SPECULAR_LIGHTING = false;
  override SPECULAR_MAP = false;
  override SPRITESHEET_MATERIAL = false;
  override SSREFL = false;
  override SUBSURFACE_SCATTERING = false;
  override SUBSURFACE_SCATTERING_MASK = false;
  override SUN_SHINE = false;
  override SUN_SPECULAR = false;
  override TEMP_SKIN = false;
  override TEMP_TERRAIN = false;
  override TEMP_VEGETATION = false;
  override THIN_HAIR = false;
  override TINT_COLOR_MAP = false;
  override TINT_MAP = false;
  override TRANSMITTANCE = false;
  override TRANSPARENT_ZPREPASS = false;
  override UNLIT = false;
  override USE_ADVANCED_DISSOLVE = false;
  override USE_AS_BEAMPROC = false;
  override USE_COMPLEX_COL = false;
  override USE_COMPLEX_COL_DODGE = false;
  override USE_COMPLEX_COL_OVERLAY = false;
  override USE_FRESNEL_DISSOLVE_MASK = false;
  override USE_FX_NORMAL_PARAMS = false;
  override USE_GLOW_FRESNEL = false;
  override USE_INSIDE_FRESNEL_ALPHA = false;
  override USE_INTERSECTION_FADE = false;
  override USE_INTERSECTION_GLOW = false;
  override USE_OUTSIDE_FRESNEL_ALPHA = false;
  override USE_PALETTE_MAP = false;
  override USE_PROC_GRADS = false;
  override USE_SDF_2D = false;
  override USE_STENCIL_DISSOLVE_MASK = false;
  override UV_VIGNETTING = false;
  override VERT_DEFORM_SINWAVE = false;
  override VERTCOLORS = false;
  override VERTICAL_GRADIENT = false;
  override WATER_TESSELLATION_DX11 = false;

  // nw-viewer additional overrides
  // Distance based dither fade, see ditherFade(). 0 = off, 1 = fade in, 2 = fade out
  override DITHER_FADE_MODE: u32 = 0u;
  // the fade happens between these camera distances
  override DITHER_FADE_START: f32 = 0.0;
  override DITHER_FADE_END: f32 = 0.0;

// #endregion

const MICRO_DETAIL_QUALITY_DEF: u32 = 0u; // default
const MICRO_DETAIL_QUALITY_OBM: u32 = 1u; // offset bump mapping
const MICRO_DETAIL_QUALITY_POM: u32 = 2u; // parallax occlusion mapping
const MICRO_DETAIL_QUALITY_SPM: u32 = 3u; // silhouette parallax occlusion mapping

const LIGHT_UNIT_SCALE: f32 = 10000.0;
const EMITTANCE_TO_ENGINE_LIGHT_SCALE: f32 = (1000.0 / LIGHT_UNIT_SCALE);

struct GlobalBlock {
  sunColor         : vec4f, // xyz = color, a = specular multiplier
  sunDirection     : vec3f,
  cloudShadingCustomSunColor  : vec3f,
  cloudShadingCustomSkyColor  : vec3f,

  bottomFogColor   : vec4f,
  bottomFogHeight  : f32,
  bottomFogDensity : f32,

  topFogColor      : vec4f,
  topFogHeight     : f32,
  topFogDensity    : f32,

  volumetricFogParams             : vec4f,
  volumetricFogRampParams         : vec4f,
  volumetricFogColorGradientParams: vec4f,
  volumetricFogColorGradientRadial: vec4f,
  volumetricFogColorGradientBase  : vec4f,
  volumetricFogColorGradientDelta : vec4f,

  fogHeightOffset  : f32,
  debug            : u32,
  // 1 while rendering opaque geometry, fog is then applied in a deferred fog pass
  skipFog          : u32,

  // xyz = ocean fog color (sun tinted), w = density (log2 base)
  oceanFogColorDensity : vec4f,
  // ocean water level (PerFrame_WaterLevel.z), far below the terrain when the level has no ocean
  oceanLevel           : f32,
  // x = atlas slot of the global probe, y = 1 uses the baked probes, 0 the dynamic sky cube
  probeGlobal          : vec4f,
  // color of the global probe, including its multipliers and the time of day
  probeDiffuseColor    : vec4f,
  probeSpecularColor   : vec4f,
  // PerFrame_VolumetricFogScatteringColor, xyz = sun color times the atmosphere fog albedo
  fogScatteringColor   : vec4f,
  // volumetric fog 2 (analytical), see VolFog2Params, enabled when volFog2Enabled != 0
  volFog2HeightDensity : vec4f,
  volFog2Ramp          : vec4f,
  volFog2Scattering    : vec4f,
  volFog2Blend         : vec4f,
  // rgb = sun color * fog albedo (sun radial), w = 1 - k * k (sun radial)
  fogScatteringSecondaryColor : vec4f,
  // rgb = ambient in-scattering without a baked global probe, see volFog2ProbeInscatter
  volFog2Ambient       : vec4f,
  // rgb = global probe color times the entities fog albedo, w = attenuation
  volFog2Probe         : vec4f,
  // x = zenith fade factor, y = zenith fade curve (exponent)
  volFog2Zenith        : vec4f,
  volFog2Enabled       : u32,
  // froxel fog volume (FroxelFogPass): x = near, y = range - near, z = 1 / (slices - 1), w = 1 / (range - near)
  froxelDepth          : vec4f,
  // x = 1 while the froxel volume of this frame is bound, y = slices, z = screen pixels per froxel
  froxelEnabled        : vec4f,
  // froxel in-scattering of the entities: rgb = fog albedo, w = anisotropy k
  volFog2Entity        : vec4f,
  // number of fog volumes injected into the froxels this frame
  fogVolumeCount       : u32,
  // global wind of the time of day (PerFrame_WindDirection): xyz = wind vector, w = its length
  windDirection        : vec4f,
  // particle brightness of the time of day (Particle Brightness Multiplier), see ParticleParams3[1] in particlestod.cfi
  particleBrightness   : f32,
  // snow volume (g_SnowVolumeParams): xyz = center, w = 1 / radius, 0 without an active volume
  snowVolumeParams     : vec4f,
  // g_SnowMultipliers: x = snow amount, y = frost amount, z = saturated surface freezing
  snowMultipliers      : vec4f,
  // x = g_SnowBrightness, y = g_FrostBrightness
  snowBrightness       : vec4f,
};

struct ObjectBlock {
  modelMatrix: mat4x4f,
};

// per instance data of level meshes, see createInstanceData
// The record size must match the instance data stride of the RenderInstanceWriter: 16 floats (64 bytes).
struct InstanceDataBlock {
  // x = max view distance of the entity, 0 = unlimited
  viewDistance: f32,
  // dissolve amount of the distance fade, 0 = fully visible, 1 = fully dissolved (see ditherFade)
  dissolveAmount: f32,
  // opacity of a projected decal (DecalComponent Opacity), 1 otherwise
  decalOpacity: f32,
  // first joint of the skinning palette + 1 (skinPalette, see skinVertex), 0 = not skinned
  skinOffset: f32,
  // 1 - the runtime opacity of the mesh (MeshComponent SetOpacity, e.g. a fading skybox), 0 = as authored
  transparency: f32,
  _pad0: f32,
  _pad1: f32,
  _pad2: f32,
  _pad3: array<vec4f, 2>,
};

// distance of the instance to the camera relative to its max view distance (GetInstance_RelativeDistance)
// 0 when the instance has no max view distance
fn instanceRelativeDistance(data: InstanceDataBlock, modelMatrix: mat4x4f) -> f32 {
  let maxViewDistance = data.viewDistance;
  if (maxViewDistance <= 0.0) {
    return 0.0;
  }
  return distance(modelMatrix[3].xyz, view.cameraPosition) / maxViewDistance;
}

struct ViewBlock {
  viewMatrix:       mat4x4f,
  projectionMatrix: mat4x4f,
  inverseViewProjectionMatrix: mat4x4f,
  cameraPosition:   vec3f,
  cameraDirection:  vec3f,
  near:             f32,
  far:              f32,
  viewportSize:     vec2f,
  // view projection of the previous frame, the current one on the first frame (g_mViewProjPrev, NDC output)
  previousViewProjectionMatrix: mat4x4f,
  // screen space reflection inputs of the SsrPass for materials (%SSREFL): x = 1 when view.hiZMap and
  // view.previousSceneColorMap are valid this frame, y = Hi-Z mip count, z = max ray length (m), w = max iterations
  ssr: vec4f,
};

struct FrameBlock {
  elapsedTime: f32,
  deltaTime: f32,
  index: f32,
};

// Forward+ cluster parameters, written each frame by the LightSystem
struct LightBlock {
  // xyz = cluster grid dimensions, w = number of lights in lightList
  clusterGrid  : vec4f,
  // x = near, y = far, z = slice scale, w = slice bias
  // slice = floor(log(viewDepth) * scale + bias)
  clusterDepth : vec4f,
};

// A single scene light as stored in the light storage buffer
struct Light {
  position : vec4f, // xyz = world position, w = range
  color    : vec4f, // rgb = diffuse color (intensity applied), w = specular multiplier
  direction: vec4f, // xyz = emit direction (projector, area), w = light type
  tangent  : vec4f, // xyz = area light width axis, w = attenuation bulb size
  params   : vec4f, // x = area half width, y = area half height, z = cos outer cone, w = cos inner cone
  bounds   : vec4f, // xyz = world bounding sphere center, w = radius
};

// Offset and count into lightIndices, one entry per cluster
struct LightCluster {
  offset: u32,
  count : u32,
};

// Index into lightList. Wrapped in a struct, so the meta codegen yields a named slot
struct LightIndex {
  light: u32,
};

// Shared light buffers, fed by the LightSystem through the 'lights' input block.
// Runtime sized: indices beyond a fixed size are clamped on Metal.
// @private
// @block lights
@group(0) @binding(8)  var<storage, read> lightList    : array<Light>;
// @private
// @block lights
@group(0) @binding(9)  var<storage, read> lightClusters: array<LightCluster>;
// @private
// @block lights
@group(0) @binding(10) var<storage, read> lightIndices : array<LightIndex>;

// Specular cubes of the probe atlas (ProbeCubeAtlas), read by the fog and the materials (probes.wgsl)
// @block global
// @private
@group(0) @binding(11) var probeSpecularCubes : texture_cube_array<f32>;
// @block global
// @private
@group(0) @binding(13) var probeSampler       : sampler;
// Integrated froxel fog volume (FroxelFogPass), sampled by getSceneFog for transparent surfaces
// @block global
// @private
@group(0) @binding(14) var froxelVolume       : texture_3d<f32>;

// A skinning joint as a unit dual quaternion (SkinPalette 'dualquat'): real = rotation, dual = 0.5 * translation * real
struct SkinJoint {
  real: vec4f,
  dual: vec4f,
};

// Skinning palettes of all animated characters back to back (CharacterAnimationSystem), each draw reads its range
// at InstanceDataBlock.skinOffset
// @block global
// @private
@group(0) @binding(16) var<storage, read> skinPalette : array<SkinJoint>;

struct SkinnedVertex {
  position: vec3f,
  normal  : vec3f,
  tangent : vec3f,
};

fn quatRotate(q: vec4f, v: vec3f) -> vec3f {
  let t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

// Dual quaternion skinning with 4 influences, the game's skinning (CryAnimation). Model space in and out.
// skinOffset is InstanceDataBlock.skinOffset: 0 returns the vertex as it is (not skinned).
fn skinVertex(
  skinOffset: f32,
  joints    : vec4<u32>,
  weights   : vec4f,
  position  : vec3f,
  normal    : vec3f,
  tangent   : vec3f,
) -> SkinnedVertex {
  var result = SkinnedVertex(position, normal, tangent);
  if (skinOffset <= 0.0) {
    return result;
  }
  let base = u32(skinOffset) - 1u;
  let q0 = skinPalette[base + joints.x];
  let q1 = skinPalette[base + joints.y];
  let q2 = skinPalette[base + joints.z];
  let q3 = skinPalette[base + joints.w];
  // influences on the other hemisphere than the first one blend negated (shortest path)
  let w1 = select(weights.y, -weights.y, dot(q0.real, q1.real) < 0.0);
  let w2 = select(weights.z, -weights.z, dot(q0.real, q2.real) < 0.0);
  let w3 = select(weights.w, -weights.w, dot(q0.real, q3.real) < 0.0);
  var real = q0.real * weights.x + q1.real * w1 + q2.real * w2 + q3.real * w3;
  var dual = q0.dual * weights.x + q1.dual * w1 + q2.dual * w2 + q3.dual * w3;
  let len = length(real);
  if (len < 1e-6) {
    return result;
  }
  real /= len;
  dual /= len;
  // translation = 2 * dual * conjugate(real)
  let translation = 2.0 * (real.w * dual.xyz - dual.w * real.xyz + cross(real.xyz, dual.xyz));
  result.position = quatRotate(real, position) + translation;
  result.normal   = quatRotate(real, normal);
  result.tangent  = quatRotate(real, tangent);
  return result;
}

struct LightParams {
  Color: vec4f,
  Position: vec4f,
  Direction: vec4f,
};

struct ShadeParams {
  V: vec3f, // View direction
  L: vec3f, // Light direction
  Kd: vec3f, // diffuse light intensity
  Kr: vec3f, // specular light intensity
};

struct ShadeOutput {
  ambient: vec3f,
  // product of the ambient lights, applies to ambient diffuse and environment specular
  ambientScale: vec3f,
  diffuse: vec3f,
  specular: vec3f,
  diffuseBack: vec3f, // transmittance
  specularRoughness: f32, // specular anti-aliased roughness, use for environment reflections
}

struct SurfaceParams {
  Transmittance : vec4f, // .rgb=back color, .a=normalViewDependency factor
  Diffuse       : vec3f,
  Alpha         : f32,
  Specular      : vec3f,
  Roughness     : f32,
  Normal        : vec4f,
  LightingModel : u32, // LIGHTINGMODEL_*, zero initialized to standard
};

struct LightResult {
  direction : vec3f,
  diffuse   : vec3f,
  specular  : vec3f,
  falloff   : f32,
  specularDirection: vec3f, // optional direction for specular (area lights), zero if unused
  specularNormalization: f32, // area lights: GGX energy normalization of the representative point, zero if unused
};

struct FragmentOutput {
  @location(0) color: vec4f,
  @location(1) depth: f32,
};

fn getLight(light: LightParams, lightType: u32, position: vec3f) -> LightResult {
  var result: LightResult;
  if (lightType == LIGHT_TYPE_DIRECTIONAL) {
    result.direction = normalize(-light.Direction.xyz);
    result.diffuse = light.Color.rgb;
    result.specular = light.Color.rgb * light.Color.a;
    result.falloff = 1.0;
    return result;
  }
  return result;
}

fn getPhysicalLightAttenuation(fDist : f32, fInvRadius : f32, fAttenuationBulbSize : f32) -> f32 {
    let radius = 1.0 / fInvRadius;
    var d = fDist;

    // Fadeout last 20% of radius
    let fadeoutFactor = saturate((radius - d) * (fInvRadius / 0.2));

    // Light attenuation model: 1 / (1 + d/lightsize)^2
    d = max(d - fAttenuationBulbSize, 0.0);
    let denom = 1.0 + d / fAttenuationBulbSize;
    let fAttenuation = fadeoutFactor * fadeoutFactor / (denom * denom);

    return fAttenuation;
}

fn closestPointOnRect(p: vec3f, center: vec3f, axisX: vec3f, axisY: vec3f, halfW: f32, halfH: f32) -> vec3f {
  let d = p - center;
  let x = clamp(dot(d, axisX), -halfW, halfW);
  let y = clamp(dot(d, axisY), -halfH, halfH);
  return center + axisX * x + axisY * y;
}

// base type and flags of a cluster light (direction.w = type + LIGHT_TYPE_AMBIENT + LIGHT_FLAG_*)
fn lightIsAmbient(light: Light) -> bool {
  return (u32(light.direction.w) & LIGHT_TYPE_AMBIENT) != 0u;
}

fn lightHasFlag(light: Light, flag: u32) -> bool {
  return (u32(light.direction.w) & flag) != 0u;
}

fn getClusterLight(light: Light, position: vec3f, reflectDir: vec3f) -> LightResult {
  var result: LightResult;
  let lightType = u32(light.direction.w) % LIGHT_TYPE_AMBIENT;
  let range = max(light.position.w, 0.0001);
  let bulb = light.tangent.w;
  let dir = light.direction.xyz;

  result.diffuse = light.color.rgb;
  result.specular = light.color.rgb * light.color.w;

  // points and spots without a branch between them, it is expensive on mobile GPUs. The cone cosines of points are
  // (-2, -1), their cone is 1 everywhere
  if (lightType != LIGHT_TYPE_AREA) {
    let toLight = light.position.xyz - position;
    let dist = length(toLight);
    let L = toLight / max(dist, 1e-5);
    let cone = smoothstep(light.params.z, light.params.w, dot(-L, dir));
    result.direction = L;
    result.falloff = getPhysicalLightAttenuation(dist, 1.0/range, bulb) * cone;
    return result;
  }

  let axisX = light.tangent.xyz;
  let axisY = cross(dir, axisX);
  let halfW = light.params.x;
  let halfH = light.params.y;
  let center = light.position.xyz;

  // only the front side emits light
  if (dot(position - center, dir) <= 0.0) {
    result.falloff = 0.0;
    return result;
  }

  // diffuse: closest point on the rectangle
  let pDiffuse = closestPointOnRect(position, center, axisX, axisY, halfW, halfH);
  let toLight = pDiffuse - position;
  let dist = length(toLight);
  result.direction = toLight / max(dist, 1e-5);
  result.falloff = getPhysicalLightAttenuation(dist, 1.0/range, bulb);

  // spot falloff of the emission (GetSpotAttenuation), no falloff when cos <= 0
  let PdotL = dot(-result.direction, dir);
  result.falloff *= 1.0 - pow(saturate(light.params.z / (PdotL + 1e-6)), range);
  // the emitter is lambertian: NdotL * saturate(PdotL) (tiled shading), ambient area lights apply PdotL themselves
  if (!lightIsAmbient(light)) {
    result.falloff *= saturate(PdotL);
  }

  // specular: representative point where the reflection ray hits the light plane
  var pSpec = pDiffuse;
  let denom = dot(reflectDir, dir);
  if (denom < -1e-4) {
    let t = dot(center - position, dir) / denom;
    if (t > 0.0) {
      pSpec = closestPointOnRect(position + reflectDir * t, center, axisX, axisY, halfW, halfH);
    }
  }
  let toSpec = pSpec - position;
  let specDist = max(length(toSpec), 1e-6);
  result.specularDirection = toSpec / specDist;
  // the roughness dependent part is applied in shadeLight (SphereNormalization)
  result.specularNormalization = saturate(length(vec2f(halfW, halfH)) / specDist);
  return result;
}

// Returns the Forward+ cluster index for a world position, or -1 if outside the cluster volume
fn getLightClusterIndex(lights: LightBlock, worldPos: vec3f) -> i32 {
  let grid = vec3u(lights.clusterGrid.xyz);
  if (grid.x == 0u || grid.y == 0u || grid.z == 0u || lights.clusterGrid.w < 1.0) {
    return -1;
  }
  let viewPos = view.viewMatrix * vec4f(worldPos, 1.0);
  let depth = -viewPos.z;
  if (depth <= 0.0 || depth > lights.clusterDepth.y) {
    return -1;
  }
  let clip = view.projectionMatrix * viewPos;
  let uv = saturate((clip.xy / clip.w) * 0.5 + 0.5);
  let tx = min(u32(uv.x * f32(grid.x)), grid.x - 1u);
  let ty = min(u32(uv.y * f32(grid.y)), grid.y - 1u);
  let slice = log(max(depth, lights.clusterDepth.x)) * lights.clusterDepth.z + lights.clusterDepth.w;
  let tz = min(u32(max(slice, 0.0)), grid.z - 1u);
  return i32(tx + ty * grid.x + tz * grid.x * grid.y);
}

fn shadeLight(output: ptr<function, ShadeOutput>, surface: SurfaceParams, toEye: vec3f, light: LightResult) {
  let V = toEye;
  let L = light.direction;
  let Kd = light.diffuse * light.falloff;
  let Kr = light.specular * light.falloff;

  let normal = surface.Normal.xyz;
  let roughness = surface.Roughness;
  let NdotL = saturate(dot(normal, L));
  let cDiffuse = Kd * diffuseBRDF(roughness, normal, V, L, NdotL);

  // area lights provide a separate representative direction for specular
  let Ls = select(L, light.specularDirection, dot(light.specularDirection, light.specularDirection) > 0.5);
  // area lights: the representative point widens the lobe by the light size (SphereNormalization in AreaLightIntersection)
  var specNorm = 1.0;
  if (light.specularNormalization > 0.0) {
    let normFactor = roughness / saturate(roughness + 0.5 * light.specularNormalization);
    specNorm = normFactor * normFactor;
  }
  let cSpecular = Kr * specularBRDF(roughness, normal, V, Ls, surface.Specular.rgb, specNorm);

  let ck = vec3(1.0); // pLight.fOcclShadow * pLight.fFallOff * pLight.cFilter;

  if (surface.LightingModel == LIGHTINGMODEL_TRANSMITTANCE) {
    // deferred tiled shading: translucent surfaces replace the diffuse term
    (*output).diffuse += Kd * thinTranslucencyBRDF(normal, L, surface.Transmittance.rgb) * ck;
  } else {
    (*output).diffuse += cDiffuse * ck;
  }
  if (surface.LightingModel == LIGHTINGMODEL_STANDARD && length(surface.Transmittance.rgb) > 0.0) {
    let fTransmitance = pow(saturate(dot(-normal, L) * 0.6 + 0.4), 1 / (1 - surface.Transmittance.a));
    (*output).diffuse += fTransmitance * Kd * surface.Transmittance.rgb * ck;
  }
  // the tiled shading weights the specular with the diffuse NdotL (nearest point on area lights)
  (*output).specular += cSpecular * ck * NdotL;
}

fn accumulateLight(lights: LightBlock, env: GlobalBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> vec3f {
  let shade = accumulateLightShade(lights, env, surface, toEye, worldPos);
  return composeShade(surface, shade);
}

// Multiplies the ambient scale with an ambient only light (TiledShading.cfi, "Ambient lights")
fn shadeAmbientLight(output: ptr<function, ShadeOutput>, surface: SurfaceParams, light: Light, result: LightResult) {
  let baseType = u32(light.direction.w) % LIGHT_TYPE_AMBIENT;
  var attenuation = result.falloff;
  // point and area attenuation is squared, projectors use the cone (the original samples the projector texture)
  if (baseType != LIGHT_TYPE_SPOT) {
    attenuation *= attenuation;
  }
  let NdotL = saturate(dot(surface.Normal.xyz, result.direction));
  var PdotL = 1.0;
  if (baseType == LIGHT_TYPE_AREA) {
    PdotL = saturate(dot(-result.direction, light.direction.xyz));
  }
  // brightening lights (color > 1) use the surface orientation, darkening lights have no directionality
  let color = light.color.rgb;
  let dirFactor = select(vec3f(PdotL), vec3f(NdotL), color > vec3f(1.0));
  (*output).ambientScale *= mix(vec3f(1.0), color, attenuation * dirFactor);
}

fn accumulateLightShade(lights: LightBlock, env: GlobalBlock, surface: SurfaceParams, toEye: vec3f, worldPos: vec3f) -> ShadeOutput {
  var output: ShadeOutput;
  output.ambientScale = vec3f(1.0);

  // --- sun
  var sun: LightParams;
  sun.Color = env.sunColor.xyzw;
  sun.Position = vec4f(0.0);
  sun.Direction = vec4f(env.sunDirection, 0.0);
  shadeLight(&output, surface, toEye, getLight(sun, LIGHT_TYPE_DIRECTIONAL, worldPos));

  // --- clustered lights (Forward+)
  let clusterIndex = getLightClusterIndex(lights, worldPos);
  if (clusterIndex < 0) {
    return output;
  }
  let cluster = lightClusters[clusterIndex];
  let reflectDir = reflect(-toEye, surface.Normal.xyz);
  for (var i = 0u; i < cluster.count; i++) {
    let light = lightList[lightIndices[cluster.offset + i].light];
    // fog only lights light the froxel fog, not surfaces; probes are shaded by environmentLight
    if (lightHasFlag(light, LIGHT_FLAG_FOG_ONLY | LIGHT_FLAG_PROBE)) {
      continue;
    }
    let result = getClusterLight(light, worldPos, reflectDir);
    if (result.falloff > 0.0) {
      if (lightIsAmbient(light)) {
        shadeAmbientLight(&output, surface, light, result);
      } else {
        shadeLight(&output, surface, toEye, result);
      }
    }
  }
  return output;
}

fn composeShade(surface: SurfaceParams, shade: ShadeOutput) -> vec3f {
  var diffuse = (shade.ambient * shade.ambientScale + shade.diffuse) * surface.Diffuse.rgb;
  diffuse *= saturate(vec3f(1.0) - getLuminance(surface.Specular.rgb));

  // TODO: reflection

  var specular = shade.specular;

  return diffuse + specular;
}

const PI: f32 = 3.141592653589793;
const EPSILON: f32 = 1e-6;

// Geometric attenuation (G)
fn pbrGeometricOcclusion(dotNL: f32, dotNV: f32, r: f32) -> f32 {
  let rSq: f32 = r * r;
  let attenuationL: f32 = 2.0 * dotNL / (dotNL + sqrt(rSq + (1.0 - rSq) * (dotNL * dotNL)));
  let attenuationV: f32 = 2.0 * dotNV / (dotNV + sqrt(rSq + (1.0 - rSq) * (dotNV * dotNV)));
  return attenuationL * attenuationV;
}

// Microfacet distribution (D)
fn pbrMicrofacetDistribution(dotNH: f32, r: f32) -> f32 {
  let rSq: f32 = r * r;
  let f: f32 = (dotNH * rSq - dotNH) * dotNH + 1.0;
  return rSq / (PI * f * f);
}

fn roughnessToPower(r: f32) -> f32 {
  let rr = max(r, 0.04);
  return 2.0 / (rr * rr) - 2.0;
}

fn burleyBRDF(roughness: f32, NdotL: f32, NdotV: f32, VdotH: f32) -> f32 {
  let dotNV = saturate(max(NdotV, 0.1));  // Prevent overly dark edges

  // Burley BRDF with renormalization to conserve energy
  let energyBias = 0.5 * roughness;
  let energyFactor = mix(1, 1 / 1.51, roughness);
  let fd90 = energyBias + 2.0 * VdotH * VdotH * roughness;
  let scatterL = mix(1, fd90, pow(1 - NdotL, 5));
  let scatterV = mix(1, fd90, pow(1 - dotNV, 5));

  return scatterL * scatterV * energyFactor * NdotL;
}

// wrapped diffuse plus back lighting of thin translucent surfaces (ThinTranslucencyBRDF, deferred tiled shading)
fn thinTranslucencyBRDF(N: vec3f, L: vec3f, transmittanceColor: vec3f) -> vec3f {
  let w = mix(0.0, 0.5, getLuminance(transmittanceColor));
  let wn = 1.0 / ((1.0 + w) * (1.0 + w));
  let NdotL = dot(N, L);
  let transmittance = saturate((-NdotL + w) * wn);
  let diffuse = saturate((NdotL + w) * wn);
  return transmittanceColor * transmittance + diffuse;
}

fn diffuseBRDF( roughness: f32, N: vec3f, V: vec3f, L: vec3f, NdotL: f32) -> f32 {
  let VdotH = saturate(dot(V, normalize(V + L)));
  let NdotV = abs(dot(N, V)) + 1e-5;

  return burleyBRDF(roughness, NdotL, NdotV, VdotH);
}

fn specularBRDF( roughness: f32, N: vec3f, V: vec3f, L: vec3f, F0: vec3f, normalizationFactor: f32 ) -> vec3f {
  let m2 = roughness * roughness;
  let Hraw = V + L;
  let H = select(normalize(Hraw), N, dot(Hraw, Hraw) < 1e-8);
  // let H = normalize( V + L );

  // The PBR terms
  let NDF = NDF_GGX( N, H, m2, normalizationFactor);  // NDF
  let G = G_CorrelatedSmith(N, V, L, m2);             // G - Correlated Smith Visibility Term (including Cook-Torrance denominator)
  let fresnel = Fresnel(L, H, F0);                    // Fresnel (Schlick approximation + micro occlusion)

  // Final specular term - normalization factors 1 / ((N*V)*(N*L) accounted for in the G term.
  let  finalSpecular = NDF * G * fresnel;

  return finalSpecular;
}

fn getAverageQuadNormal(pixelPos: vec2i, n: vec3f) -> vec3f {
  var outN = n;
  outN -= dpdxFine(outN) * (f32(pixelPos.x & 1) - 0.5);
  outN -= dpdyFine(outN) * (f32(pixelPos.y & 1) - 0.5);
  return outN;
}

fn getKaplanyanFilteringRect(
  tbn: mat3x3f,
  pixelPos: vec2i,
  roughnessMaxFootprint: f32
) -> vec2<f32> {
    // Shading frame
    let T        = tbn[0];
    let ShFrameN = normalize(tbn[2]);
    let ShFrameS = normalize(T - ShFrameN * dot(ShFrameN, T));
    let ShFrameT = cross(ShFrameN, ShFrameS);

    var hppW = getAverageQuadNormal(pixelPos, ShFrameN);

    hppW /= dot(ShFrameN, hppW);
    let hpp = vec2<f32>(dot(hppW, ShFrameS), dot(hppW, ShFrameT));

    var filteringRect = (abs(dpdxFine(hpp)) + abs(dpdyFine(hpp))) * 0.5;
    return min(vec2f(roughnessMaxFootprint + 1e-5), filteringRect);
}

fn getKaplanyanRoughness(
  tbn : mat3x3f,
  pixelPos : vec2i,
  roughness : f32,
  roughnessBoost: f32,
  roughnessMaxFootprint: f32,
) -> f32 {
  let filteringRect = getKaplanyanFilteringRect(tbn, pixelPos, roughnessMaxFootprint);

  let covariance = filteringRect * filteringRect * 2.0 * roughnessBoost;
  let maxIsotropicEdge = max(covariance.x, covariance.y);

  return sqrt(roughness * roughness + maxIsotropicEdge);
}

fn getReflectColorRoughness(cubeMap: texture_cube<f32>, cubeSampler: sampler, reflection: vec3f, roughness: f32) -> vec3f {
  return getReflectColor(cubeMap, cubeSampler, reflection, roughnessToSmoothness(roughness));
}

fn getReflectColor(cubeMap: texture_cube<f32>, cubeSampler: sampler, reflection: vec3f, gloss: f32) -> vec3f {
  let reflectionLod = (1.0 - gloss) * f32(6 - 1u);
  return textureSampleLevel(cubeMap, cubeSampler, cryVecToGLTF(reflection), reflectionLod).rgb;
}

//-------------------------------------------------------------------------
// GGX NDF:
// Spec Cry (optimized) = NormFactor * rough2 / [cos2 * (rough2 - 1) + 1]^2
// Spec GGX =      NormFactor / [cos2 * rough2 + sin2]^2   AND  sin2 = 1 - cos2
//            -->  NormFactor / [cos2 * rough2 + 1 - cos2]^2
//            -->  NormFactor / [cos2 * (rough2 - 1) + 1]^2
//-------------------------------------------------------------------------
fn NDF_GGX(N: vec3f, H: vec3f, roughSq: f32, normalizationFactor: f32) -> f32 {
  let   NdotH = saturate(dot(N, H));
  var   SpecGGX = NdotH * (NdotH * roughSq - NdotH) + 1.0;
  SpecGGX = normalizationFactor * roughSq / max((SpecGGX * SpecGGX), FLOAT_EPSILON );

  return SpecGGX;
}

fn G_CorrelatedSmith(N: vec3f, V: vec3f, L: vec3f, m2: f32) -> f32 {
  let NdotL = saturate(dot(N, L));
  let NdotV = abs(dot(N, V));
  let Gv = NdotL * sqrt((-NdotV * m2 + NdotV) * NdotV + m2);
  let Gl = NdotV * sqrt((-NdotL * m2 + NdotL) * NdotL + m2);
  let SmithG = 0.5 / max(Gv + Gl, FLOAT_EPSILON);

  return SmithG;
}

fn Fresnel(L: vec3f, H: vec3f, F0: vec3f ) -> vec3f {
  let F90 = saturate(dot(F0, vec3f(0.33333)) / vec3f(0.02));
  let finalFresnel = mix(F0, F90, pow(1 - saturate(dot(L, H)), 5));

  return finalFresnel;
}

// Standard Fresnel Schlick approximation
fn fresnelSchlick(R: vec3f, dotLH: f32) -> vec3f {
  return R + (vec3f(1.0) - R) * pow(1.0 - dotLH, 5.0);
}

// Fresnel Schlick with f90 adjustment
fn fresnelSchlickf90(f0: vec3f, f90: vec3f, u: f32) -> vec3f {
  let clamped: f32 = clamp(1.0 - u, 0.0, 1.0);
  return f0 + (f90 - f0) * pow(clamped, 5.0);
}

fn smoothnessToRoughness(smoothness: f32) -> f32 {
  return max( (1.0 - smoothness) * (1.0 - smoothness), MIN_ROUGHNESS);
}

fn roughnessToSmoothness(roughness: f32) -> f32 {
  return 1.0 - sqrt(roughness);
}

fn decodeNormal(encoded: vec2f) -> vec3f {
  let xy = encoded;
  let z = sqrt(saturate(1.0 + dot(xy, -xy)));
  return normalize(vec3f(xy, z));
}

// a normal map sample by the encoding of its texture (scale, bias): signed formats (the game's BC5_SNORM) 1, 0;
// unsigned ones (KTX2 exports, png) 2, -1. See normalMapEncoding of the materials.
fn decodeNormalMap(encoded: vec2f, scaleBias: vec2f) -> vec3f {
  return decodeNormal(encoded * scaleBias.x + scaleBias.y);
}

fn uvScaleOffset(uv: vec2f, scaleOffset: vec4f) -> vec2f {
  return uv * scaleOffset.xy + scaleOffset.zw;
}

fn srgbToLinear(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.04045);
  return select( c / 12.92, pow((c + 0.055) / 1.055, vec3f(2.4)), c > cutoff );
}

fn linearToSrgb(c: vec3f) -> vec3f {
  let cutoff = vec3f(0.0031308);
  return select( 12.92 * c, 1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c > cutoff );
}

// #region Dither fade

// 4x4 ordered dither threshold in [0, 1), same pattern as the impostor dissolve in illum.cfx
fn ditherThreshold(pixel: vec2f) -> f32 {
  const values = array<f32, 16>(9.0, 12.0, 7.0, 15.0, 2.0, 5.0, 13.0, 4.0, 16.0, 3.0, 14.0, 10.0, 6.0, 1.0, 8.0, 11.0);
  let p = vec2u(pixel) % 4u;
  return (values[p.x * 4u + p.y] - 0.5) / 16.0;
}

// Discards pixels to fade by camera distance between DITHER_FADE_START and DITHER_FADE_END.
// Fade in and fade out use the same threshold, so two layers with the same range blend without gaps or overlap.
//
// dissolveAmount is how far the distance fade is applied:
// - 0: fully visible, no pixel is discarded
// - 1: the distance fade is fully applied, pixels on the faded side are fully dissolved
fn ditherFade(pixel: vec2f, distance: f32, dissolveAmount: f32) {
  if (DITHER_FADE_MODE == 0u) {
    return;
  }
  let fade = saturate((distance - DITHER_FADE_START) / max(DITHER_FADE_END - DITHER_FADE_START, 1e-3));

  let threshold = ditherThreshold(pixel);
  // fade in: invisible before the range, visible after it
  if (DITHER_FADE_MODE == 1u && threshold >= mix(1.0, fade, dissolveAmount)) {
    discard;
  }
  // fade out: visible before the range, invisible after it
  if (DITHER_FADE_MODE == 2u && threshold < fade * dissolveAmount) {
    discard;
  }
}

// #endregion

fn getLuminance(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

fn getOverlayBlend(base: vec3f, top: vec3f) -> vec3f {
  let out0 = 2.0 * base * top;
  let out1 = 1.0 - (2.0 * (1.0 - base) * (1.0 - top));
  return mix(out0, out1, step(vec3f(0.5), base));
}

// #region Overlay masking (CharacterMasking.cfi, Illum / HumanSkin / Hair %OVERLAY_MASK and %COLOR_SAMPLER_OVERLAY_MASK)

// Material params of %OVERLAY_MASK (public params Mask_*)
struct OverlayMaskParams {
  maskR                 : f32,
  maskRColor            : vec3f,
  maskROverride         : f32,
  maskG                 : f32,
  maskGColor            : vec3f,
  maskGOverride         : f32,
  maskB                 : f32,
  maskBColor            : vec3f,
  maskBOverride         : f32,
  maskAGloss            : f32,
  maskAGlossShift       : f32,
  maskASpecColor        : vec3f,
  maskASpecColorOverride: f32,
};

// Surface attributes changed by the overlay masking
struct OverlayMaskSurface {
  albedo  : vec3f,
  specular: vec3f,
  gloss   : f32,
};

// %OVERLAY_MASK: dye colors per mask channel (rgb), gloss and specular color by the alpha channel (AddMasking)
fn applyOverlayMask(s: OverlayMaskSurface, mask: vec4f, p: OverlayMaskParams) -> OverlayMaskSurface {
  var r = s;
  // the game's luminance weights of CharacterMasking.cfi
  let luminance = vec3f(dot(s.albedo, vec3f(0.2125, 0.7154, 0.0721)));
  // overrides are squared, the game found them too bright
  let colorR = mix(getOverlayBlend(luminance, p.maskRColor), p.maskRColor * p.maskRColor, p.maskROverride);
  let colorG = mix(getOverlayBlend(luminance, p.maskGColor), p.maskGColor * p.maskGColor, p.maskGOverride);
  let colorB = mix(getOverlayBlend(luminance, p.maskBColor), p.maskBColor * p.maskBColor, p.maskBOverride);
  r.albedo = mix(r.albedo, colorR, mask.r * p.maskR);
  r.albedo = mix(r.albedo, colorG, mask.g * p.maskG);
  r.albedo = mix(r.albedo, colorB, mask.b * p.maskB);

  // gloss shift: 0.5 is neutral, 0 pulls to zero, 1 to full gloss; Mask_A_Gloss is the amount
  var shifted = s.gloss;
  shifted = mix(0.0, shifted, saturate(p.maskAGlossShift / 0.5));
  shifted = mix(shifted, 1.0, saturate((p.maskAGlossShift - 0.5) / 0.5));
  r.gloss = mix(s.gloss, shifted, mask.a * p.maskAGloss);

  r.specular = mix(s.specular, p.maskASpecColor, mask.a * p.maskASpecColorOverride);
  return r;
}

// %COLOR_SAMPLER_OVERLAY_MASK: the mask texture holds the color itself (AddMasking)
fn applyColorSamplerMask(albedo: vec3f, mask: vec4f, strength: f32, colorOverride: f32, alphaInfluence: f32) -> vec3f {
  let luminance = vec3f(dot(albedo, vec3f(0.2125, 0.7154, 0.0721)));
  let color = mix(getOverlayBlend(luminance, mask.rgb), mask.rgb, colorOverride);
  let alpha = mix(1.0, mask.a, alphaInfluence);
  return mix(albedo, color, alpha * strength);
}

// #endregion

// #region Rim lighting (RimLighting.cfi, %RIM_DIFFUSE_LIGHTING / %RIM_SPEC_LIGHTING)

// Material params Rim_*
struct RimParams {
  majorColor     : vec3f,
  majorIntensity : f32,
  majorWidth     : f32,
  fillColor      : vec3f,
  fillIntensity  : f32,
  fillWidth      : f32,
  colorBlend     : f32,
  smoothness     : f32,
  centerColor    : vec3f,
  centerIntensity: f32,
};

// IsRimLightingActive
fn rimLightingActive(p: RimParams) -> bool {
  let v = vec3f(p.majorIntensity * p.majorWidth, p.fillIntensity * p.fillWidth, p.centerIntensity);
  return dot(v, v) > 0.0;
}

// The fake rim light of GetRimLighting_CustomLighting: a light from the eye with a fresnel shaped NdotL, stronger towards
// the top right of the screen (major axis). x = rgb light color (times the rim map), w = the NdotL of the light.
fn rimLight(N: vec3f, toEye: vec3f, p: RimParams, rimMap: f32) -> vec4f {
  // camera right and up in world space: the rows of the view matrix
  let right = vec3f(view.viewMatrix[0].x, view.viewMatrix[1].x, view.viewMatrix[2].x);
  let up    = vec3f(view.viewMatrix[0].y, view.viewMatrix[1].y, view.viewMatrix[2].y);
  let majorAxis = normalize(0.5 * right + up);
  let majorAxisIntensity = dot(N, majorAxis) * 0.5 + 0.5;

  let width = mix(p.fillWidth, p.majorWidth, saturate((majorAxisIntensity - 0.45) / 0.10));
  let colorLerp = saturate((majorAxisIntensity - (0.5 - p.colorBlend * 0.5)) / max(p.colorBlend, 0.00001));

  var fresnel = 1.0 - abs(dot(toEye, N));
  fresnel = saturate((fresnel - 1.0 + width) / max(0.001, p.smoothness));

  var color = mix(p.fillColor * p.fillIntensity, p.majorColor * p.majorIntensity, colorLerp);
  let intensity = mix(saturate(abs(p.fillIntensity)), saturate(abs(p.majorIntensity)), majorAxisIntensity);
  color = mix(color, p.centerColor * p.centerIntensity, saturate(1.0 - fresnel));
  fresnel = mix(saturate(abs(p.centerIntensity)), intensity, fresnel);
  return vec4f(color * rimMap, fresnel);
}

// The rim light shaded with the default per light function (ClusterForward_DefaultLighting.cfi), as it is added to the
// emittance: diffuse and specular light, not multiplied by the albedo
fn rimLightingDefault(N: vec3f, toEye: vec3f, smoothness: f32, specular: vec3f, light: vec4f, useDiffuse: bool, useSpecular: bool) -> vec3f {
  let roughness = smoothnessToRoughness(smoothness);
  let NdotL = saturate(light.w);
  var result = vec3f(0.0);
  if (useDiffuse) {
    result += light.rgb * diffuseBRDF(roughness, N, toEye, toEye, NdotL);
  }
  if (useSpecular) {
    result += light.rgb * specularBRDF(roughness, N, toEye, toEye, specular, 1.0) * NdotL;
  }
  return result;
}

// #endregion

// %FX_DISSOLVE (BlendAndDissolve.cfi ClipDissolvedFragsImpl): discards where the noise (BlendMap.g, $Opacity) is below
// the percentage, and returns the edge color inside the edge band. Fragment stage only.
fn clipDissolve(noise: f32, percentage: f32, edgeThickness: f32, edgeColor: vec3f, color: vec3f) -> vec3f {
  let threshold = noise - percentage;
  if (threshold < 0.0) {
    discard;
  }
  if (threshold < edgeThickness && percentage > 0.0 && percentage < 1.0) {
    return edgeColor;
  }
  return color;
}

fn cryVecToGLTF(v: vec3f) -> vec3f {
  return v.xzy * vec3(1.0, 1.0, -1.0);
}

fn getCotangentFrame(
  position: vec3f,
  normal: vec3f,
  uv: vec2f
) -> mat3x3<f32> {
  let posdx: vec3f = dpdx(position);
  let posdy: vec3f = dpdy(position);
  let uvdx: vec2f = dpdx(uv);
  let uvdy: vec2f = dpdy(uv);

  let q1perp: vec3f = cross(posdy, normal);
  let q0perp: vec3f = cross(normal, posdx);

  let tangent: vec3f =
      q1perp * uvdx.x + q0perp * uvdy.x;

  let bitangent: vec3f =
      q1perp * uvdx.y + q0perp * uvdy.y;

  let det: f32 = max(
      dot(tangent, tangent),
      dot(bitangent, bitangent)
  );

  let scale: f32 = select(
      inverseSqrt(det),
      0.0,
      det == 0.0
  );

  return mat3x3f(
    normalize(tangent * scale),
    normalize(bitangent * scale),
    normal
  );
}

// #region Scene Depth
// Converts clip-space position to projected screen coords for depth-buffer sampling.
// Y is flipped for WebGPU NDC convention.
// .w is preserved as-is (= clip.w = view-space Z for standard perspective).
fn clipPosToSceenUv(p: vec4f) -> vec4f {
  return vec4f(
    ( p.x + p.w) * 0.5,
    (-p.y + p.w) * 0.5,
    p.z,
    p.w,
  );
}

// Reads the linear view-space depth from the scene depth texture at screen UV.
// sceneDepthMap is expected to contain linear view-space depth.
fn sampleSceneDepth(screenProj: vec4f, sceneDepthMap: texture_2d<f32>) -> f32 {
  let uv      = screenProj.xy / screenProj.w;
  let dims    = vec2f(textureDimensions(sceneDepthMap, 0));
  let pxCoord = vec2i(uv * dims);
  return textureLoad(sceneDepthMap, pxCoord, 0).r;
}


fn linearizeDepthReversedZ(depth: f32, near: f32, far: f32) -> f32 {
  return (near * far) / (depth * (far - near) + near);
}
// #endregion

// #region Fog
fn applyFog(
  color:    vec3f,
  alpha:    f32,
  worldPos: vec3f,
  camPos:   vec3f,
) -> vec4f {
  if (global.skipFog != 0u) {
    return vec4f(color, alpha);
  }
  // same fog as the fog pass and the sky
  let fog = getSceneFog(worldPos);
  return vec4f(color * fog.a + fog.rgb, alpha);
}

// World position on the far plane behind a pixel (fragCoord in pixels, origin top-left, reversed-z).
// Sky pixels (and geometry drawn on the sky like the distance clouds) are fogged at this position.
fn farPlaneWorldPos(fragCoord: vec2f) -> vec3f {
  let ndc = vec4f(
    (fragCoord.x / view.viewportSize.x) * 2.0 - 1.0,
    1.0 - (fragCoord.y / view.viewportSize.y) * 2.0,
    0.0, // reversed-z: 0 = far plane
    1.0
  );
  let worldH = view.inverseViewProjectionMatrix * ndc;
  return worldH.xyz / worldH.w;
}

// Ambient of the global probe in a direction for shaders without a surface normal (particles). The lowest mip of
// the specular cube stands in for the diffuse cube, which only Illum and Terrain bind.
// Falls back to the fog stand-in without a baked probe.
fn globalProbeAmbient(direction: vec3f) -> vec3f {
  if (global.probeGlobal.y < 0.5) {
    return global.volFog2Ambient.rgb;
  }
  let cube = textureSampleLevel(probeSpecularCubes, probeSampler, direction, i32(global.probeGlobal.x), 6.0).rgb;
  return cube * global.probeDiffuseColor.rgb;
}

fn globalVolFog2Params() -> VolFog2Params {
  var p: VolFog2Params;
  p.heightDensity = global.volFog2HeightDensity;
  p.ramp          = global.volFog2Ramp;
  p.scattering    = global.volFog2Scattering;
  p.blend         = global.volFog2Blend;
  p.color1        = global.fogScatteringColor;
  p.color2        = global.fogScatteringSecondaryColor;
  p.zenith        = global.volFog2Zenith;
  return p;
}

// Fog towards a world position, rgb = premultiplied fog color (in-scattering), a = transmittance.
// Apply as color * fog.a + fog.rgb
fn getSceneFog(worldPos: vec3f) -> vec4f {
  let cameraToWorldPos = worldPos - view.cameraPosition.xyz;
  if (global.volFog2Enabled != 0u) {
    var p = globalVolFog2Params();
    p.ambient = volFog2ProbeInscatter(
      probeSpecularCubes, probeSampler, global.probeGlobal.x, global.volFog2Probe, global.volFog2Ambient, cameraToWorldPos,
    );
    // global.sunDirection points away from the light
    if (global.froxelEnabled.x > 0.5) {
      // the froxel volume up to the ray-marching range like the opaque surfaces (FogPass), analytical beyond
      let inscatter = volFog2Inscatter(p, cameraToWorldPos, -global.sunDirection);
      return volFog2WithNear(p, cameraToWorldPos, inscatter, sampleFroxelFog(worldPos, p.zenith.z));
    }
    return volFog2Analytical(p, cameraToWorldPos, -global.sunDirection);
  }
  // volumetric fog off (config volumetricFog): no fog, the legacy fog is not tuned by New World
  return vec4f(0.0, 0.0, 0.0, 1.0);
}

// The integrated froxel volume towards a world position (GetVolumetricFogValue), the range rectified to the linear
// depth (RectifyVolumetricFogTexcoordAndRange): rgb = in-scattering, a = transmittance
fn sampleFroxelFog(worldPos: vec3f, range: f32) -> vec4f {
  let viewPos = view.viewMatrix * vec4f(worldPos, 1.0);
  let clip = view.projectionMatrix * viewPos;
  let ndc = clip.xy / clip.w;
  let pixel = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5) * view.viewportSize;
  let linearDepth = max(-viewPos.z, 1e-4);
  let len = max(length(worldPos - view.cameraPosition), 1e-4);
  return sampleFroxelVolume(pixel, linearDepth, range * linearDepth / len);
}

// froxel volume at a screen pixel and linear depth, clamped to the (rectified) range
fn sampleFroxelVolume(pixel: vec2f, linearDepth: f32, rangeDepth: f32) -> vec4f {
  let dims = vec2f(textureDimensions(froxelVolume).xy);
  // quadratic slices (GetVolumetricFogDepthTexcoord), sampled at the texel center of the slice back
  let d = sqrt(max(min(rangeDepth, linearDepth) - global.froxelDepth.x, 0.0) * global.froxelDepth.w);
  let slices = global.froxelEnabled.y;
  let tc = vec3f(pixel / (dims * global.froxelEnabled.z), ((slices - 1.0) * d + 0.5) / slices);
  return textureSampleLevel(froxelVolume, probeSampler, tc, 0.0);
}

// fog transmittance towards a world position
fn getVolumetricFogDensity(worldPos: vec3f) -> f32 {
  // volumetric fog off: getSceneFog returns no fog
  return getSceneFog(worldPos).a;
}

fn computeVolumetricFogInternal(cameraToWorldPos: vec3f) -> f32  {
  let heightScale                 = global.volumetricFogParams.x;
  let volFogHeightDensityAtViewer = global.volumetricFogParams.y;
  let fogDensity                  = global.volumetricFogParams.z;
  let densityClamp                = global.volumetricFogParams.w;

  var fogInt = 1.0;
  var t = heightScale * cameraToWorldPos.z;
  if (abs(t) > 0.01) {
    fogInt *= (exp(t) - 1.0) / t;
  }

  // NOTE: volFogHeightDensityAtViewer = log2(e) * fogDensity * exp(heightScale * PerView_WorldViewPos.z + heightOffset);
  let l = length(cameraToWorldPos) * 1.0; // PerFrame_FogDistanceScale.x;
  let u = l * volFogHeightDensityAtViewer;
  fogInt *= u;

  var f = saturate(exp2(-fogInt));
  var r = saturate(l * global.volumetricFogRampParams.x + global.volumetricFogRampParams.y);
  r = r * (2 - r);
  r = r * global.volumetricFogRampParams.z + global.volumetricFogRampParams.w;

  f = (1.0 - f) * r;
  return max(1.0 - f, densityClamp);
}

fn getVolumetricFogColor(worldPos: vec3f) -> vec4f {
  return getVolumetricFogColorInternal(worldPos, worldPos - view.cameraPosition.xyz, 1.0, 1.0);
}

// RET.xyz = fog color (HDR)
// RET.w = fog factor to lerp scene/object color with (i.e. lerp(RET.xyz, sceneColor.xyz, RET.w))
fn getVolumetricFogColorInternal(worldPos: vec3f, cameraToWorldPos: vec3f, radialFogShadowInfluence: f32, ambientFogShadowInfluence: f32) -> vec4f {
	let heightGradScale  = global.volumetricFogColorGradientParams.x;
	let heightGradOffset = global.volumetricFogColorGradientParams.y;
	let radialSizeCtrl   = global.volumetricFogColorGradientParams.z;
	let radialLobeCtrl   = global.volumetricFogColorGradientParams.w;

	let radialColor = global.volumetricFogColorGradientRadial.xyz;
	let invZFar     = global.volumetricFogColorGradientRadial.w;

	let fog = computeVolumetricFogInternal(cameraToWorldPos);

	var h = saturate(worldPos.z * heightGradScale + heightGradOffset);
	h = h * (2 - h);

	var fogColor = (global.volumetricFogColorGradientBase.rgb + h * global.volumetricFogColorGradientDelta.rgb) * ambientFogShadowInfluence;

	let l = saturate(length(cameraToWorldPos) * invZFar);
	let radialLobe = pow(l, radialLobeCtrl);
	let radialSize = exp2(dot(normalize(cameraToWorldPos), -global.sunDirection.xyz) * -radialSizeCtrl + radialSizeCtrl); // exp2(-radialSizeCtrl * (1-cos(x))

	fogColor += radialLobe * radialSize * radialColor * radialFogShadowInfluence;

	return vec4f(fogColor, fog);
}
// #endregion









// #region Vertex Transform Modificators


// Vertex modificators

////////////////////////////////////////////////////////////////////////////////////////////////////
// Vertex modificator types (%_VT_TYPE):
// 1 (VTM_SINWAVE): Sinus wave deformations
// 2 (VTM_SINWAVE_VTXCOL): Sinus wave deformations using vertex color for phase/freq/amp control
// 3 (VTM_BULGE)  : Bulge wave deformations (depends on texture coordinates)
// 4 (VTM_SQUEEZE)  : Sinus squeeze wave deformations
// 5 (VTM_PERLIN2D) : Surface 2D perlin-noise deformations
// 6 (VTM_PERLIN3D) : Volume 3D perlin-noise deformations
// 7 (VTM_FROMCENTER) : Expanding from center
// 12 (VTM_FIXED_OFFSET) : Fixed 3D offset along vertex normal

// Vertex modificator flags (in order of applying):
// %_VT_WIND          : Wind deformations (uses for Cloth and Hair shaders)
// %_VT_DEPTH_OFFSET  : Depth offset (uses for decals)
// %_VT_DET_BEND      : Detail bending (uses for Vegetations and requires Color stream with specific weight info)
// %_VT_BEND          : General bending (engine depend)

// %_VT_TYPE_MODIF    : Specified if one or more of vertex modif. flags is existing
////////////////////////////////////////////////////////////////////////////////////////////////////

// Vertex modificator types
const VTM_SINWAVE        : u32 = 1u;
const VTM_SINWAVE_VTXCOL : u32 = 2u;
const VTM_BULGE          : u32 = 3u;
const VTM_SQUEEZE        : u32 = 4u;
const VTM_PERLIN2D       : u32 = 5u;
const VTM_PERLIN3D       : u32 = 6u;
const VTM_FROMCENTER     : u32 = 7u;
const VTM_BENDING        : u32 = 8u;
const VTM_FIXED_OFFSET   : u32 = 12u;

struct VertexMod {
  deformWave0 : vec4f, // .x = Frequency .y = Phase .z = Amplitude .w = Level
  deformWave1 : vec4f, // .x = 1.0 / DividerX
  position    : vec3f,
  normal      : vec3f,
  color       : vec3f,
  texture     : vec2f,
  time        : f32,
  typ         : u32,
};

fn vertexModify(vmod: VertexMod) -> vec3f {
  var outPos = vmod.position.xyz;

  let deformWave0 = vmod.deformWave0; // [0]: .x = Frequency .y = Phase .z = Amplitude .w = Level
  let deformWave1 = vmod.deformWave1; // [1]: .x = 1.0 / DividerX
  let timeValue = vmod.time * deformWave0.x + deformWave0.y;
  switch (vmod.typ) {
    case VTM_SINWAVE: {
      var f      = (outPos.x + outPos.y + outPos.z) * deformWave1.x;
          f      = (f + timeValue) * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave;
    }
    case VTM_SINWAVE_VTXCOL: {
      var f      = (outPos.x + outPos.y + outPos.z) * deformWave1.x * vmod.color.y;
          f      = (f + timeValue + vmod.color.x) * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave * vmod.color.z;
    }
    case VTM_SQUEEZE: {
      var f      = timeValue * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave;
    }
    case VTM_BULGE: {
      var f      = (vmod.texture.x + vmod.texture.y + outPos.x + outPos.y + outPos.z) * deformWave1.x;
          f      = (f + timeValue) * PI;
      let fWave  = sin(f) * deformWave0.z + deformWave0.w;
      outPos    += vmod.normal.xyz * fWave;
    }
    case VTM_FIXED_OFFSET: {
      let fOffset = deformWave0.w;
      outPos     += vmod.normal.xyz * fOffset;
    }
    default : {

    }
  }

  return outPos;
}

// #endregion
`

export function smoothnessToRoughness(smoothness: number): number {
  return Math.max((1.0 - smoothness) * (1.0 - smoothness), 0.002)
}
