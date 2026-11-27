import {
  CommonInputs,
  inputSlotBuffer,
  inputSlotSampler,
  inputSlotScalar,
  inputSlotTexture,
  inputSlotVec3,
  inputSlotVec4,
  TRUE,
  BlendState,
  DepthState,
  Effect,
  type Device,
  type EffectOptions,
  type RenderVariant,
} from '@gglib/graphics'
import { brand } from '@gglib/utils'

/**
 * Render variants of the viewer in addition to {@link RenderVariant}
 */
export const NwRenderVariant = {
  /**
   * Emittance of opaque surfaces, added to the lit color after the deferred lighting (`fs_emissive`).
   * Only materials with emittance register it.
   */
  Emissive: brand<RenderVariant>('emissive'),
  /**
   * Material debug view (`global.debug`) of opaque surfaces, drawn over the lit image while a debug mode is selected
   * (`fs_debug`). Modes without a material view draw nothing.
   */
  Debug: brand<RenderVariant>('debug'),
  /**
   * Projected (deferred) decal box, blended into the GBuffer by the DecalPass (`fs_decal`, plan 7.7).
   * %DECAL materials register it, the box entities of DecalComponents render it.
   */
  ProjectedDecal: brand<RenderVariant>('projectedDecal'),
  /**
   * Emittance of a projected decal, added to the lit color after the deferred lighting (`fs_decal_emissive`),
   * like the game's FX_DeferredDecalsEmissive. Only %DECAL materials with emittance register it.
   */
  ProjectedDecalEmissive: brand<RenderVariant>('projectedDecalEmissive'),
}

export const InputBlocks = {
  Global: 'global',
  View: 'view',
  Frame: 'frame',
  Object: 'object',
  Material: 'material',
  Lights: 'lights',
}

export const InputSlots = {
  /**
   * Forward+ light data, written by the LightSystem. Shared by all materials.
   */
  Lights: {
    /**
     * xyz = cluster grid dimensions, w = light count
     */
    ClusterGrid: inputSlotVec4('lights', 'clusterGrid'),
    /**
     * x = near, y = far, z = slice scale, w = slice bias
     */
    ClusterDepth: inputSlotVec4('lights', 'clusterDepth'),
    /**
     * Storage buffer with all light records
     */
    LightList: inputSlotBuffer('lights', 'lightList'),
    /**
     * Storage buffer with offset and count per cluster
     */
    LightClusters: inputSlotBuffer('lights', 'lightClusters'),
    /**
     * Storage buffer with light indices referenced by the clusters
     */
    LightIndices: inputSlotBuffer('lights', 'lightIndices'),
  },
  /**
   * Sun shafts post process (SunShaftsPass), not bound by materials
   */
  SunShafts: {
    /**
     * x = active, y = rays attenuation, z = shafts amount, w = rays amount
     */
    Params: inputSlotVec4('sunShafts', 'params'),
    /**
     * rgb = rays color (SunShafts_SunCol), already scaled by the rays amount
     */
    Color: inputSlotVec4('sunShafts', 'color'),
  },
  /**
   * Tone mapping of the game (FilmMappingPass), not bound by materials
   */
  FilmMapping: {
    /**
     * rgb = color balance, a = saturation
     */
    ColorBalance: inputSlotVec4('filmMapping', 'colorBalance'),
    /**
     * x = shoulder, y = midtones, z = toe, w = whitepoint
     */
    FilmCurve: inputSlotVec4('filmMapping', 'filmCurve'),
    /**
     * x = exposure, used when the eye adaptation is off
     */
    Exposure: inputSlotVec4('filmMapping', 'exposure'),
    /**
     * x = EV min, y = EV max, z = EV auto compensation (HDREyeAdaptation, EV mode), w = 1 enables the eye adaptation
     */
    EyeAdaptation: inputSlotVec4('filmMapping', 'eyeAdaptation'),
    /**
     * Blend factor of the bloom (HDRBloomColor): time of day bloom amount * 0.3 / 8 (C3DEngine::GetHDRSetupParams)
     */
    Bloom: inputSlotScalar('filmMapping', 'bloom'),
  },
  View: {
    ViewMatrix: CommonInputs.View.ViewMatrix,
    ProjectionMatrix: CommonInputs.View.ProjectionMatrix,
    CameraPosition: CommonInputs.View.CameraPosition,
    /**
     * View projection of the previous frame (the game's g_mViewProjPrev without the texture coordinate scale-bias),
     * maintained by the renderer per view
     */
    PreviousViewProjectionMatrix: CommonInputs.View.PreviousViewProjectionMatrix,
    /**
     * HDR scene color of the previous frame after the transparents (the game's $HDRTargetPrev), kept by the
     * PreviousColorPass. Check `PreviousColorPass.isPreviousFrame` before trusting it.
     */
    PreviousSceneColorMap: inputSlotTexture('view', 'previousSceneColorMap'),
    /**
     * Hi-Z min linear depth pyramid of this frame (SsrPass), mip 0 is half the render size
     */
    HiZMap: inputSlotTexture('view', 'hiZMap'),
    /**
     * x = 1 when HiZMap and PreviousSceneColorMap are valid this frame, y = Hi-Z mip count, z = max ray length (m),
     * w = max iterations (SsrPass)
     */
    Ssr: inputSlotVec4('view', 'ssr'),
    /**
     * GBuffer A as the receiver normal of the projected decals (angle fade), a copy made before the DecalPass
     */
    DecalNormalMap: inputSlotTexture('view', 'decalNormalMap'),
  },
  Global: {
    SunColor: inputSlotVec4('global', 'sunColor'),
    SunDirection: inputSlotVec3('global', 'sunDirection'),
    /**
     * Global wind of the time of day (PerFrame_WindDirection): xyz = wind vector, w = its length
     */
    WindDirection: inputSlotVec4('global', 'windDirection'),
    /**
     * Particle brightness of the time of day (`Particle Brightness Multiplier`, Engine global parameter 76), scaled per
     * effect by its TOD brightness influence
     */
    ParticleBrightness: inputSlotScalar('global', 'particleBrightness'),
    /**
     * The active snow volume (SnowSystem, g_SnowVolumeParams): xyz = center, w = 1 / radius, w = 0 without snow
     */
    SnowVolumeParams: inputSlotVec4('global', 'snowVolumeParams'),
    /**
     * g_SnowMultipliers: x = snow amount, y = frost amount, z = saturated surface freezing
     */
    SnowMultipliers: inputSlotVec4('global', 'snowMultipliers'),
    /**
     * x = snow brightness (g_SnowBrightness), y = frost brightness (g_FrostBrightness)
     */
    SnowBrightness: inputSlotVec4('global', 'snowBrightness'),
    CloudShadingSunColor: inputSlotVec3('global', 'cloudShadingCustomSunColor'),
    CloudShadingSkyColor: inputSlotVec3('global', 'cloudShadingCustomSkyColor'),

    VolumetricFogParams: inputSlotVec4('global', 'volumetricFogParams'),
    VolumetricFogRampParams: inputSlotVec4('global', 'volumetricFogRampParams'),
    VolumetricFogColorGradientParams: inputSlotVec4('global', 'volumetricFogColorGradientParams'),
    VolumetricFogColorGradientRadial: inputSlotVec4('global', 'volumetricFogColorGradientRadial'),
    VolumetricFogColorGradientBase: inputSlotVec4('global', 'volumetricFogColorGradientBase'),
    VolumetricFogColorGradientDelta: inputSlotVec4('global', 'volumetricFogColorGradientDelta'),

    BottomFogColor: inputSlotVec3('global', 'bottomFogColor'),
    BottomFogHeight: inputSlotScalar('global', 'bottomFogHeight'),
    BottomFogDensity: inputSlotScalar('global', 'bottomFogDensity'),
    TopFogColor: inputSlotVec3('global', 'topFogColor'),
    TopFogHeight: inputSlotScalar('global', 'topFogHeight'),
    TopFogDensity: inputSlotScalar('global', 'topFogDensity'),
    FogHeightOffset: inputSlotScalar('global', 'fogHeightOffset'),
    FogNear: inputSlotScalar('global', 'fog_near'),
    FogFar: inputSlotScalar('global', 'fog_far'),
    /**
     * xyz = ocean fog color (sun tinted), w = density (log2 base)
     */
    OceanFogColorDensity: inputSlotVec4('global', 'oceanFogColorDensity'),
    /**
     * Ocean water level (PerFrame_WaterLevel.z), {@link NO_OCEAN_LEVEL} when the level has no ocean
     */
    OceanLevel: inputSlotScalar('global', 'oceanLevel'),
    /**
     * PerFrame_VolumetricFogScatteringColor, xyz = sun color times the atmosphere fog albedo
     */
    FogScatteringColor: inputSlotVec4('global', 'fogScatteringColor'),
    /**
     * Volumetric fog 2 parameters, see VolFog2Params in volumetricFog2.wgsl.ts
     */
    VolFog2HeightDensity: inputSlotVec4('global', 'volFog2HeightDensity'),
    VolFog2Ramp: inputSlotVec4('global', 'volFog2Ramp'),
    VolFog2Scattering: inputSlotVec4('global', 'volFog2Scattering'),
    VolFog2Blend: inputSlotVec4('global', 'volFog2Blend'),
    FogScatteringSecondaryColor: inputSlotVec4('global', 'fogScatteringSecondaryColor'),
    /**
     * Ambient in-scattering of the volumetric fog 2 without a baked global probe (previews).
     * Also the particle ambient until particles read the probes.
     */
    VolFog2Ambient: inputSlotVec4('global', 'volFog2Ambient'),
    /**
     * Global probe in-scattering of the volumetric fog 2 (PerFrame_VolumetricFogGlobalEnvProbe0),
     * rgb = probe color times the entities fog albedo, w = attenuation, 0 falls back to {@link VolFog2Ambient}
     */
    VolFog2Probe: inputSlotVec4('global', 'volFog2Probe'),
    /**
     * Zenith fade of the volumetric fog 2, x = factor, y = curve exponent
     */
    VolFog2Zenith: inputSlotVec4('global', 'volFog2Zenith'),
    VolFog2Enabled: inputSlotScalar('global', 'volFog2Enabled'),
    /**
     * Integrated froxel fog volume of this frame (FroxelFogPass), rgb = in-scattering, a = transmittance. Transparent
     * materials sample it in getSceneFog like the game (GetVolumetricFogValueJittered).
     */
    FroxelVolume: inputSlotTexture('global', 'froxelVolume'),
    /**
     * Slices of the froxel volume: x = near, y = range - near, z = 1 / (slices - 1), w = 1 / (range - near)
     */
    FroxelDepth: inputSlotVec4('global', 'froxelDepth'),
    /**
     * x = 1 while the froxel volume of this frame is bound, y = slices, z = screen pixels per froxel
     */
    FroxelEnabled: inputSlotVec4('global', 'froxelEnabled'),
    /**
     * Froxel in-scattering of the entities (ExponentialHeightFogColor, InjectInscatteringParams):
     * rgb = fog albedo (VOLFOG2_COLOR), w = anisotropy k (VOLFOG2_ANISOTROPIC)
     */
    VolFog2Entity: inputSlotVec4('global', 'volFog2Entity'),
    /**
     * Number of packed fog volumes in {@link FogVolumes} this frame (FogVolumeSystem)
     */
    FogVolumeCount: inputSlotScalar('global', 'fogVolumeCount'),
    /**
     * Storage buffer with the packed fog volumes (FogVolumeSystem), read by the froxel injection
     */
    FogVolumes: inputSlotBuffer('global', 'fogVolumes'),
    /**
     * Storage buffer with the dual quaternion skinning palettes of all animated characters (CharacterAnimationSystem),
     * each skinned draw reads its range at the instance skin offset ({@link setInstanceSkinOffset})
     */
    SkinPalette: inputSlotBuffer('global', 'skinPalette'),

    Debug: inputSlotScalar('global', 'debug'),
    /**
     * When set to 1, materials skip fog (deferred to the fog pass). Set by the opaque pass
     */
    SkipFog: inputSlotScalar('global', 'skipFog'),
    EnvMap: inputSlotTexture('global', 'envMap'),
    /**
     * Cube arrays of the probe atlas, see ProbeCubeAtlas
     */
    ProbeSpecularCubes: inputSlotTexture('global', 'probeSpecularCubes'),
    ProbeDiffuseCubes: inputSlotTexture('global', 'probeDiffuseCubes'),
    /**
     * Sampler of the probe cubes for code without a material sampler (fog)
     */
    ProbeSampler: inputSlotSampler('global', 'probeSampler'),
    /**
     * x = atlas slot of the global probe, y = 1 uses the baked probes, 0 the dynamic sky cube
     */
    ProbeGlobal: inputSlotVec4('global', 'probeGlobal'),
    ProbeDiffuseColor: inputSlotVec4('global', 'probeDiffuseColor'),
    ProbeSpecularColor: inputSlotVec4('global', 'probeSpecularColor'),
  },
}

export const DebugOptions = {
  DEBUG_OFF: 0,
  // Material
  DEBUG_MTL_ALBEDO: 1,
  DEBUG_MTL_SPECULAR: 2,
  DEBUG_MTL_METALLIC: 3,
  DEBUG_MTL_ROUGHNESS: 4,
  DEBUG_MTL_IOR: 5,
  DEBUG_MTL_EMISSIVE: 6,
  DEBUG_MTL_AO: 7,
  DEBUG_MTL_OPACITY: 8,
  DEBUG_MTL_HEIGHT: 9,
  DEBUG_MTL_NOISE: 10,

  // Geometry / vectors
  DEBUG_GV_NORMAL: 100,
  DEBUG_GV_TANGENT: 101,
  DEBUG_GV_BITANGENT: 102,
  DEBUG_GV_SHADE_NORMAL: 103,
  DEBUG_GV_POSITION_WS: 104,
  DEBUG_GV_DEPTH: 105,

  // Vertex attributes
  DEBUG_V_COLOR0: 200,
  DEBUG_V_COLOR1: 201,
  DEBUG_V_UV0: 202,
  DEBUG_V_UV1: 203,
  DEBUG_V_UV3: 204,
  DEBUG_V_UV4: 205,
  DEBUG_V_UV5: 206,
  DEBUG_V_DEFORM: 207,

  // Shading components
  DEBUG_SH_DIFFUSE: 300,
  DEBUG_SH_SPECULAR: 301,
  DEBUG_SH_SHADOW: 302,
  DEBUG_SH_AMBIENT: 303,
  DEBUG_SH_REFLECTION: 304,
  DEBUG_SH_FRESNEL: 305,
  DEBUG_SH_COUNT: 306,
  DEBUG_SH_SPECULAR_AA: 307,

  // Terrain virtual texture
  DEBUG_VT_MIP: 400,
  DEBUG_VT_NO_MACRO: 401,
} as const

export const MaterialLayerMasks = {
  Common: 1 << 0,
  Terrain: 1 << 1,
  Illum: 1 << 2,
  Vegetation: 1 << 3,
  Glass: 1 << 4,
  GeometryFog: 1 << 5,
  GeometryBeam: 1 << 6,
  DistanceClouds: 1 << 7,
  Meshparticle: 1 << 8,
  FxMeshAdvanced: 1 << 9,
  ParticleImposter: 1 << 10,
  /**
   * Entities that are not active when their slice is instantiated (isRuntimeActive = false),
   * e.g. alternative states switched by scripts or cutscenes. Hidden by default (camera visibility mask).
   */
  Inactive: 1 << 11,
  /**
   * Water volume surfaces (rivers, water volumes)
   */
  WaterVolume: 1 << 12,
  /**
   * Sprite particles of particle emitters
   */
  Particle: 1 << 13,
  /**
   * %DECAL materials, blended into the GBuffer by the MeshDecalPass after the GBufferPass (plan 7.5)
   */
  MeshDecal: 1 << 14,
  /**
   * Box entities of projected decals (DecalComponent), as the entity layer (replaces the material layer), so the
   * DecalPass renders them and the MeshDecalPass skips them (plan 7.7). The GBuffer list excludes it, the other lists
   * include {@link NON_PROJECTED_DECAL_LAYERS}. Lists must not exclude it by layer: unlayered items (LayerMask.All)
   * intersect any exclude mask and would drop.
   */
  ProjectedDecal: 1 << 15,
}

/**
 * Entity layer flags, added on top of the layer ({@link MaterialLayerMasks}). They share its bits but are no layers: an
 * item is visible when any of its bits is in the visibility mask of the camera, so the mask must not contain them.
 */
export const MaterialLayerFlags = {
  /**
   * Decal receivers (mesh components with acceptDecals), the GBuffer pass writes the receiver stencil bit for them and
   * for terrain
   */
  DecalReceiver: 1 << 16,
  /**
   * Snow receivers (mesh components with acceptSnow), the GBuffer pass writes the snow receiver stencil bit for them
   * and for terrain
   */
  SnowReceiver: 1 << 17,
}

/**
 * All bits of {@link MaterialLayerFlags}
 */
export const MATERIAL_LAYER_FLAGS = MaterialLayerFlags.DecalReceiver | MaterialLayerFlags.SnowReceiver

/**
 * Include mask that skips the decal boxes in general lists (emissive, debug, forward, transparent): the box layer is
 * exactly {@link MaterialLayerMasks.ProjectedDecal}, so it is the only layer that does not intersect this mask, while
 * unlayered items (LayerMask.All) and all other layers do. Without it a decal material with emittance or opacity
 * draws its box as a mesh, with the decal texture on the box faces.
 */
export const NON_PROJECTED_DECAL_LAYERS = ~MaterialLayerMasks.ProjectedDecal

const FLAGS_ARRAY = [
  'ADVANCED',
  'ALLOW_SILHOUETTE_POM',
  'ALLOW_SPECULAR_ANTIALIASING',
  'ALLOW_TESSELATION',
  'ALPHAMASK_DETAILMAP',
  'ANISO_SPECULAR',
  'APPLY_FOG_COLOR',
  'APPLY_SUN_COLOR',
  'BILINEAR_FP16',
  'BLENDLAYER_UV_SET_2',
  'BLENDLAYER',
  'BLUR_REFRACTION',
  'BUMP_MAP',
  'COLOR_LOOKUP',
  'COLOR_SAMPLER_OVERLAY_MASK',
  'DECAL_MAP',
  'DECAL',
  'DEFORMATION',
  'DEPTH_FIXUP',
  'DEPTH_FOG',
  'DETAIL_BENDING',
  'DETAIL_MAPPING',
  'DIFFUSE_MAP_2',
  'DIFFUSE_MAP_3',
  'DIFFUSE_MAP_4',
  'DIRECTION_MAP',
  'DIRT_MAP',
  'DIRTLAYER',
  'DISPLACEMENT_MAPPING',
  'EMISSIVE_DECAL',
  'EMITTANCE_MAP_UV_SET_2',
  'EMITTANCE_MAP',
  'ENABLE_FADEOUT',
  'ENFORCE_TILED_SHADING',
  'ENVIRONMENT_MAP',
  'FLOW_MAP',
  'FLOW',
  'FOAM',
  'FX_ADVANCED_SS',
  'FX_DISSOLVE',
  'FX_SS_CUSTOM_DIR',
  'GLOW_FRESNEL',
  'GLOW_MAP',
  'GRADIENT_ALPHA',
  'GRASS',
  'HAIR_PASS',
  'HAS_DECAL_LAYERS',
  'IS_GDE_IMPOSTOR',
  'IS_POI_IMPOSTOR',
  'LEAVES',
  'LOCAL_WEATHER',
  'NOISE',
  'NORMAL_MAP',
  'OCCLUSION_MAP',
  'OFFSET_BUMP_MAPPING',
  'OVERLAY_MASK',
  'PARALLAX_OCCLUSION_MAPPING',
  'PHONG_TESSELLATION',
  'PN_TESSELLATION',
  'RECEIVE_SHADOWS',
  'REFRACTION_TINTING',
  'REFRACTION',
  'RIM_BLEND',
  'RIM_DIFFUSE_LIGHTING',
  'RIM_SPEC_LIGHTING',
  'SAA_FILTERING',
  'SCREEN_SPACE_DEFORMATION',
  'SIGNED_DISTANCE_FIELD_2D',
  'SILHOUETTE_PARALLAX_OCCLUSION_MAPPING',
  'SIMPLE',
  'SOFT_PARTICLE',
  'SOLID_HAIR',
  'SPEC_MAP',
  'SPECULAR_LIGHTING',
  'SPECULAR_MAP',
  'SPRITESHEET_MATERIAL',
  'SSREFL',
  'SUBSURFACE_SCATTERING_MASK',
  'SUBSURFACE_SCATTERING',
  'SUN_SHINE',
  'SUN_SPECULAR',
  'TEMP_SKIN',
  'TEMP_TERRAIN',
  'TEMP_VEGETATION',
  'THIN_HAIR',
  'TINT_COLOR_MAP',
  'TINT_MAP',
  'TRANSMITTANCE',
  'TRANSPARENT_ZPREPASS',
  'UNLIT',
  'USE_ADVANCED_DISSOLVE',
  'USE_AS_BEAMPROC',
  'USE_COMPLEX_COL_DODGE',
  'USE_COMPLEX_COL_OVERLAY',
  'USE_COMPLEX_COL',
  'USE_FRESNEL_DISSOLVE_MASK',
  'USE_FX_NORMAL_PARAMS',
  'USE_GLOW_FRESNEL',
  'USE_INSIDE_FRESNEL_ALPHA',
  'USE_INTERSECTION_FADE',
  'USE_INTERSECTION_GLOW',
  'USE_OUTSIDE_FRESNEL_ALPHA',
  'USE_PALETTE_MAP',
  'USE_PROC_GRADS',
  'USE_SDF_2D',
  'USE_STENCIL_DISSOLVE_MASK',
  'UV_VIGNETTING',
  'VERT_DEFORM_SINWAVE',
  'VERTCOLORS',
  'VERTICAL_GRADIENT',
  'WATER_TESSELLATION_DX11',
] as const

export type FeatureFlag = (typeof FLAGS_ARRAY)[number]

export const FeatureFlags = new Set<FeatureFlag>(FLAGS_ARRAY)

export function getShaderFlags(genMask: string | null): Set<FeatureFlag> {
  const result = new Set<FeatureFlag>()
  for (const feature of (genMask || '').toUpperCase().split('%')) {
    if (feature) {
      result.add(feature as FeatureFlag)
    }
  }
  return result
}

export function setDitherFadeConstants(
  constants: Record<string, number>,
  options: {
    mode: 'in' | 'out'
    start: number
    end: number
  },
) {
  constants['DITHER_FADE_MODE'] = options.mode === 'in' ? 1 : 2
  constants['DITHER_FADE_START'] = options.start
  constants['DITHER_FADE_END'] = options.end
}

/**
 * Whether a material emits light, the same check as the shaders (luminance of PerMaterial_EmissiveColor.xyz)
 */
export function hasEmittance(emissiveColor: { x: number; y: number; z: number } | null | undefined): boolean {
  if (!emissiveColor) {
    return false
  }
  return emissiveColor.x * 0.2126 + emissiveColor.y * 0.7152 + emissiveColor.z * 0.0722 > 0
}

/**
 * Effect of the {@link NwRenderVariant.Emissive} variant: adds the emittance onto the lit opaque surface that the
 * GBuffer effect wrote. Same culling as the GBuffer effect, depth tested against its depth without writing.
 */
export function createEmissiveEffect(device: Device, options: EffectOptions, gbuffer: Effect): Effect {
  const effect = new Effect(device, options)
  effect.cullState = gbuffer.cullState
  effect.blendState = BlendState.AdditivePure
  // reversed z
  effect.depthState = DepthState.GreaterEqualNoWrite
  return effect
}

/**
 * Effect of the {@link NwRenderVariant.Debug} variant: replaces the lit color of the opaque surface that the GBuffer
 * effect wrote. Same culling as the GBuffer effect, depth tested against its depth without writing.
 */
export function createDebugEffect(device: Device, options: EffectOptions, gbuffer: Effect): Effect {
  const effect = new Effect(device, options)
  effect.cullState = gbuffer.cullState
  effect.blendState = BlendState.Opaque
  // reversed z
  effect.depthState = DepthState.GreaterEqualNoWrite
  return effect
}

export function getShaderConstants(flags: Set<FeatureFlag>) {
  const constants: Record<string, number> = {}
  for (const feature of flags) {
    if (FeatureFlags.has(feature)) {
      constants[feature] = TRUE
    }
  }
  return constants
}

export const MaterialMapNames = new Set([
  'Diffuse',
  'Bumpmap',
  'Specular',
  'Environment',
  'Detail',
  'SecondSmoothness',
  'Heightmap',
  'Decal',
  'SubSurface',
  'Custom',
  '[1] Custom',
  'Opacity',
  'Smoothness',
  'Emittance',
  'Occlusion',
  'Specular2',
  '[2] Custom',
  '[3] Custom',
  '[4] Custom',
  '[5] Custom',
  '[5] Smoothness',
])

// Lumberyard uses:
// float4      SPIBendInfo;
// float4      SPIBendInfoPrev;
// float4      SPIAmbientOpacity;
// float4      SPIDissolveRef;
// TODO: replace single value setter with full row writer: setInstanceDissolveRef

export function setInstanceMaxViewDistance(instance: Float32Array, value: number) {
  instance[0] = value
}

export function setInstanceDissolveAmount(instance: Float32Array, value: number) {
  instance[1] = value
}

/**
 * Opacity of a projected decal (DecalComponent Opacity), multiplied with the material opacity
 */
export function setInstanceDecalOpacity(instance: Float32Array, value: number) {
  instance[2] = value
}

/**
 * Runtime opacity of the mesh (MeshComponent SetOpacity, e.g. a fading skybox), multiplied with the material opacity
 * by the shaders that read it. Stored as `1 - opacity`, so the zero filled default is the authored opacity.
 */
export function setInstanceOpacity(instance: Float32Array, value: number) {
  instance[4] = 1 - value
}

/**
 * First joint of a skinned draw in {@link InputSlots.Global.SkinPalette}, null for a static draw. Stored as offset + 1,
 * so the zero filled default is not skinned.
 */
export function setInstanceSkinOffset(instance: Float32Array, offset: number | null) {
  instance[3] = offset == null ? 0 : offset + 1
}

export function createInstanceData(options: {
  maxViewDistance?: number
  dissolveAmount?: number
  decalOpacity?: number
}) {
  const data = new Float32Array(16)
  if (options.maxViewDistance != null) {
    setInstanceMaxViewDistance(data, options.maxViewDistance)
  }
  if (options.dissolveAmount != null) {
    setInstanceDissolveAmount(data, options.dissolveAmount)
  }
  setInstanceDecalOpacity(data, options.decalOpacity ?? 1)
  return data
}
