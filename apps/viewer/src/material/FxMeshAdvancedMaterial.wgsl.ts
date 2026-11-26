import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'

/**
 * FxMeshAdvanced shader (fxmeshadvanced.cfx), full deferred like Illum.
 *
 * Opaque materials take their GBuffer from the ZPass (ClusterForward_CommonZPass.cfi), which has FX additions the
 * General pass lacks: the 2D SDF distorts the base uv, %USE_FX_NORMAL_PARAMS, the advanced dissolve
 * (%USE_FRESNEL_DISSOLVE_MASK / %USE_STENCIL_DISSOLVE_MASK) and the fake sub surface %FX_ADVANCED_SS.
 * The additive emissive pass (General, frag_custom_end) reads the GBuffer normal, so it uses the ZPass surface too,
 * with the General SDF on the emittance uv. The forward entry (transparent materials) is the General pass.
 *
 * Not ported: %USE_PALETTE_MAP (not reached on this shader), the SSS index (%SUBSURFACE_SCATTERING, plan 3.5),
 * ParticleTimeOfDay_Emissive (ParticleParams3, set by particle emitters, 1 for meshes).
 */
export default /* wgsl */ `

struct MaterialBlock {
  diffuseColor            : vec4f, // .w = opacity
  specularColor           : vec4f, // .w = smoothness
  emissiveColor           : vec4f,
  emittanceMapGamma       : f32,   // default 1.0

  indirectcolor            : vec4f, // default 0.25, 0.25, 0.25, 0.25
  emissivescaleintensity   : f32, // default 1.0
  sssindex                 : f32, // default 0

  animamplitudewav0        : f32, // default 0.0
  animamplitudewav2        : f32, // default 0.0
  animfrequency            : f32, // default 0.0
  animphase                : f32, // default 1.0

  dissolveFresnelFalloff   : f32, // default 1.0
  dissolveFresnelInvert    : f32, // default 0.0
  dissolvePercent          : f32, // default 0.0

  fresnelExponent          : f32, // default 1.0
  fresnelInvert            : f32, // default 1.0
  fresnelStrength          : f32, // default 1.0

  fxNormalStrength         : f32, // default 0.5
  fxNormalTileX            : f32, // default 1.0
  fxNormalTileY            : f32, // default 1.0

  paletteFalloff           : f32, // default 1.0
  palettePhase             : f32, // default 0.0
  paletteSdfInf            : f32, // default 0.0
  paletteSourceBlend       : f32, // default 0.0
  paletteSpeed             : f32, // default 1.0

  sdf2dPhaseX              : f32, // default 0.0
  sdf2dPhaseY              : f32, // default 0.0
  sdf2dSpeedX              : f32, // default 0.0
  sdf2dSpeedY              : f32, // default 0.0
  sdf2dStrength            : f32, // default 0.1
  sdf2dTileX               : f32, // default 1.0
  sdf2dTileY               : f32, // default 1.0

  sinewaveAmp              : f32, // default 0.1
  sinewaveAxis             : f32, // default 0
  sinewaveFreq             : f32, // default 1.0
  sinewaveNormal           : f32, // default 0
  sinewavePhase            : f32, // default 0.1
  sinewaveSpeed            : f32, // default 0.1

  source2dPhaseX           : f32, // default 0.0
  source2dPhaseY           : f32, // default 0.0
  source2dSpeedX           : f32, // default 0.0
  source2dSpeedY           : f32, // default 0.0
  source2dTileX            : f32, // default 1.0
  source2dTileY            : f32, // default 1.0

  stencilInvert             : f32, // default 0.0
  stencilNormalInfluence    : f32, // default 0.0
  stencilOffsetX            : f32, // default 0.0
  stencilOffsetY            : f32, // default 0.0

  subSurfaceClarity         : f32, // default 1.0
  subSurfaceColor           : vec4f, // default 0.5, 0.7, 1.0, 1.0
  subSurfaceDetailBlend     : f32, // default 0.0
  subSurfaceDetailPow       : f32, // default 1.0
  subSurfaceDirX            : f32, // default 0.0
  subSurfaceDirY            : f32, // default 0.0
  subSurfaceDirZ            : f32, // default 0.0
  subSurfaceFalloff         : f32, // default 2.0
  subSurfaceParallax        : f32, // default -0.2
  subSurfaceThreshold       : f32, // default 2.0
  subSurfaceTile            : f32, // default 1.0

  // -- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  uvModEmittance                 : mat4x4f,
  uvModDecalEmissive             : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1
  enabledUvModEmittance          : u32,     // _ModifyEmittanceUV
  enabledUvModDecalEmissive      : u32,     // _ModifyEmissiveMultiplierUV

  deformWave0                    : vec4f,
  deformWave1                    : vec4f,

  // xy = scale, bias of normalMap, zw = of normalMap2, by their texture formats (decodeNormalMap)
  normalMapEncoding              : vec4f,
}

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
// @private
@group(0) @binding(3) var<uniform>       lights  : LightBlock;

@group(1) @binding(0) var<storage, read> object  : array<ObjectBlock>; // per instance data

@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear      : sampler;
@group(2) @binding(2) var samplerPoint       : sampler;

// @block view
// @unfilterable
@group(1) @binding(4) var sceneDepthMap     : texture_2d<f32>;

// -- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (paletteMapTex)
@group(3) @binding(5) var translucencyMap    : texture_2d<f32>; // $SecondSmoothness
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) 2D SDF, sub surface depth detail
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (emissiveIntensity)
@group(3) @binding(8) var subsurfaceMap      : texture_2d<f32>; // $Subsurface
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $CustomMap    (maskTex) dissolve stencil
@group(3) @binding(10) var normalMap2        : texture_2d<f32>; // $CustomSecondaryMap
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMapTex)
@group(3) @binding(14) var occlusionMap      : texture_2d<f32>; // $Occlusion
@group(3) @binding(15) var specularMap2      : texture_2d<f32>; // $Specular2

struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) tangent  : vec4f,
  @location(3) texture  : vec2f,
  @location(4) color    : vec4f,
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0) worldPos      : vec3f,
  @location(1) uvBase        : vec4f,
  @location(2) uvEmittance   : vec4f,
  @location(3) uvScreen      : vec4f, // HPosToScreenTC of the position
  @location(4) @interpolate(perspective, centroid) worldTangent  : vec4f,
  @location(5) @interpolate(perspective, centroid) worldNormal   : vec3f,
  @location(6) @interpolate(perspective, centroid) worldBitangent: vec3f,
  @location(7) vertexColor   : vec4f,
  @location(8) toEye         : vec3f,
  @location(9) objScreenPos  : vec4f, // HPosToScreenTC of the object pivot (stencil dissolve mask)
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {

  var vPos = input.position.xyz;
  if (material.deformWave1.w > 0) {
    var vmod: VertexMod;
    vmod.deformWave0 = material.deformWave0;
    vmod.deformWave1 = material.deformWave1;
    vmod.position = vPos;
    vmod.normal   = input.normal.xyz;
    vmod.color    = input.color.rgb;
    vmod.texture  = input.texture.xy;
    vmod.time     = frame.elapsedTime;
    vmod.typ      = u32(material.deformWave1.w);
    vPos = vertexModify(vmod);
  }

  if (VERT_DEFORM_SINWAVE) {
    vPos = fxSinWave(
      input.position.xyz,
      material.sinewaveAmp,
      material.sinewaveFreq,
      material.sinewaveSpeed,
      material.sinewavePhase,
      material.sinewaveAxis,
      select(vec3f(0.0), input.normal.xyz, material.sinewaveNormal == 1.0)
    );
  }

  // --- Common
  let modelMatrix = object[input.id].modelMatrix;
  let worldPos    = modelMatrix * vec4f(vPos, 1.0);
  let viewPos     = view.viewMatrix * worldPos;
  var clipPos     = view.projectionMatrix * viewPos;
  let toEye       = normalize(view.cameraPosition - worldPos.xyz);

  // --- UV
  var uvBase = vec4f(input.texture, 0.0, 1.0);
  var uvBaseMod = uvBase;
  if (material.enabledUvModDiffuse != 0u) {
    uvBaseMod = material.uvModDiffuse * uvBase;
  }
  // --- UV MOD EMITTANCE/EMISSIVE: the emissive map and the emissive intensity map have independent modifiers
  var uvEmittance = vec4f(0.0);
  if (EMITTANCE_MAP) {
    var uv1 = uvBase;
    var uv2 = uvBase;
    if (material.enabledUvModEmittance != 0u) {
      uv1 = material.uvModEmittance * uv1;
    }
    if (material.enabledUvModDecalEmissive != 0u) {
      uv2 = material.uvModDecalEmissive * uv2;
    }
    uvEmittance = vec4f(uv1.xy, uv2.xy);
  }

  // --- TBN: tangent gets the object scale, normal the inverse scale, bitangent reconstructed from the two
  let rotScaleMat = mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  );
  let normalMat = inverseScaleMatrix(rotScaleMat);
  let handedness = input.tangent.w;
  let tangent    = normalize(rotScaleMat * input.tangent.xyz);
  let normal     = normalize(normalMat   * input.normal.xyz);
  let bitangent  = cross(normal, tangent) * handedness;

  var output: FragmentInput;
  output.position       = clipPos;
  output.worldPos       = worldPos.xyz;
  output.worldNormal    = normal;
  output.worldTangent   = vec4f(tangent, handedness);
  output.worldBitangent = bitangent;
  output.vertexColor    = input.color;
  output.toEye          = toEye;
  output.uvBase         = uvBaseMod;
  output.uvEmittance    = uvEmittance;
  output.uvScreen       = clipPosToSceenUv(clipPos);
  output.objScreenPos   = vec4f(0.0, 0.0, 0.0, 1.0);
  if (USE_ADVANCED_DISSOLVE && USE_STENCIL_DISSOLVE_MASK) {
    // object pivot in screen space
    output.objScreenPos = clipPosToSceenUv(view.projectionMatrix * view.viewMatrix * vec4f(modelMatrix[3].xyz, 1.0));
  }
  return output;
}

// FXSDFFloatDomain (FxLib.cfi): a scalar noise from the height map, scrolled over the domain
fn fxSdf2d(domain: vec2f, time: f32) -> f32 {
  let uv = domain * vec2f(material.sdf2dTileX, material.sdf2dTileY)
    + time * vec2f(material.sdf2dSpeedX, material.sdf2dSpeedY)
    + vec2f(material.sdf2dPhaseX, material.sdf2dPhaseY);
  return textureSample(heightMap, samplerLinear, uv).x * material.sdf2dStrength;
}

// The source domain distorted by the SDF (pPass.IN.emittanceTC in General, IN.baseTC in the ZPass)
fn fxSdfSourceDomain(domain: vec2f, sdf: f32, time: f32) -> vec2f {
  return domain * vec2f(material.source2dTileX, material.source2dTileY)
    + vec2f(sdf)
    + time * vec2f(material.source2dSpeedX, material.source2dSpeedY)
    + vec2f(material.source2dPhaseX, material.source2dPhaseY);
}

// Surface attributes of a fragment, shared by all entry points
struct FxSurface {
  toEye       : vec3f,
  normal      : vec3f,
  albedo      : vec3f,
  alpha       : f32,
  specular    : vec3f,
  gloss       : f32,
  ao          : f32,
  uvBase      : vec4f,
  uvEmittance : vec2f,
  sdf2d       : f32,
};

// zpass = true: the ZPass attributes (GBuffer, ClusterForward_CommonZPass.cfi), false: the General pass (forward).
// May discard (advanced dissolve).
fn fxSurface(input: FragmentInput, zpass: bool) -> FxSurface {
  let time = frame.elapsedTime;

  let toEye = normalize(input.toEye);
  let tbn = mat3x3f(
    normalize(input.worldTangent.xyz),
    normalize(input.worldBitangent.xyz),
    normalize(input.worldNormal.xyz),
  );

  var uvBase      = input.uvBase;
  var uvEmittance = input.uvEmittance.xy;

  // --- 2D SDF: General distorts the emittance uv, the ZPass the base uv of all GBuffer maps
  var sdf2d = 0.0;
  if (SIGNED_DISTANCE_FIELD_2D) {
    if (EMITTANCE_MAP) {
      let sdf = fxSdf2d(uvEmittance, time);
      uvEmittance = fxSdfSourceDomain(uvEmittance, sdf, time);
      sdf2d = sdf;
    }
    if (zpass) {
      let sdf = fxSdf2d(uvBase.xy, time);
      uvBase = vec4f(fxSdfSourceDomain(uvBase.xy, sdf, time), uvBase.zw);
      sdf2d = sdf;
    }
  }

  let cDiffuseMap = textureSample(diffuseMap, samplerLinear, uvBase.xy);

  // --- normal
  var normalTS = vec3f(0.0, 0.0, 1.0);
  if (zpass) {
    if (NORMAL_MAP) {
      if (USE_FX_NORMAL_PARAMS) {
        let tile = vec2f(material.fxNormalTileX, material.fxNormalTileY);
        normalTS = decodeNormalMap(textureSample(normalMap, samplerLinear, uvBase.xy * tile).xy, material.normalMapEncoding.xy);
        normalTS *= vec3f(material.fxNormalStrength, material.fxNormalStrength, 1.0);
      } else {
        normalTS = decodeNormalMap(textureSample(normalMap, samplerLinear, uvBase.xy).xy, material.normalMapEncoding.xy);
      }
    }
  } else {
    // frag_custom_begin re-fetches the normal map with a tile of 2 for transparent draws
    normalTS = decodeNormalMap(textureSample(normalMap, samplerLinear, uvBase.xy * 2.0).xy, material.normalMapEncoding.xy);
  }
  let normal = normalize(tbn * normalTS);

  // --- albedo, alpha
  var albedo = cDiffuseMap.rgb * material.diffuseColor.rgb;
  var alpha  = cDiffuseMap.a * material.diffuseColor.a;
  if (VERTCOLORS) {
    albedo *= input.vertexColor.rgb;
    alpha  *= input.vertexColor.a;
  }

  // --- reflectance: the ZPass starts from the material color, General from the (optional) map
  var specular = select(vec3f(0.0), vec3f(1.0), zpass);
  if (SPECULAR_MAP) {
    specular = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;
  }
  specular *= material.specularColor.rgb;
  let gloss = material.specularColor.a * textureSample(smoothnessMap, samplerLinear, uvBase.xy).r;

  if (zpass) {
    if (USE_ADVANCED_DISSOLVE) {
      fxAdvancedDissolve(input, normal, toEye);
    }
    if (FX_ADVANCED_SS) {
      albedo = fxAdvancedSubSurface(albedo, normal, toEye, tbn, uvBase.xy);
    }
  }

  var s: FxSurface;
  s.toEye       = toEye;
  s.normal      = normal;
  s.albedo      = albedo;
  s.alpha       = alpha;
  s.specular    = specular;
  s.gloss       = gloss;
  s.ao          = 1.0;
  s.uvBase      = uvBase;
  s.uvEmittance = uvEmittance;
  s.sdf2d       = sdf2d;
  return s;
}

// %USE_ADVANCED_DISSOLVE of the ZPass: clips by a fresnel mask and / or a screen space stencil centered on the
// object pivot (scaled by its distance, so it keeps its size in the world)
fn fxAdvancedDissolve(input: FragmentInput, normal: vec3f, toEye: vec3f) {
  if (!(USE_FRESNEL_DISSOLVE_MASK || USE_STENCIL_DISSOLVE_MASK)) {
    return;
  }
  var stencil = 0.0;
  if (USE_STENCIL_DISSOLVE_MASK) {
    let aspect = view.viewportSize.x / view.viewportSize.y;
    let screenPos = input.uvScreen.xy / input.uvScreen.w * vec2f(aspect, 1.0);
    let osp = input.objScreenPos;
    var centered = (screenPos - vec2f(osp.x / osp.w * aspect, osp.y / osp.w)) * (osp.w / 10.0);
    centered += normal.xy * material.stencilNormalInfluence;
    let uv = centered + vec2f(material.stencilOffsetX, material.stencilOffsetY);
    stencil = textureSample(diffuseMap2, samplerLinear, uv).x;
    stencil = mix(stencil, 1.0 - stencil, material.stencilInvert) * 0.99;
  }
  var fresnel = 0.0;
  if (USE_FRESNEL_DISSOLVE_MASK) {
    fresnel = fxFresnelApprox(toEye, normal, material.dissolveFresnelInvert, material.dissolveFresnelFalloff, 1.0) * 0.99;
  }
  var mask = fresnel + stencil;
  if (USE_FRESNEL_DISSOLVE_MASK && USE_STENCIL_DISSOLVE_MASK) {
    mask = saturate(fresnel / 2.0 + stencil / 2.0);
  }
  if (mask - material.dissolvePercent < 0.0) {
    discard;
  }
}

// %FX_ADVANCED_SS of the ZPass: a fake sub surface color away from the light, with a parallax shifted depth detail
// from the height map, replaces the albedo
fn fxAdvancedSubSurface(albedo: vec3f, normal: vec3f, toEye: vec3f, tbn: mat3x3f, uv: vec2f) -> vec3f {
  var L = -global.sunDirection; // PerFrame_SunDirection, towards the sun
  if (FX_SS_CUSTOM_DIR) {
    L = vec3f(material.subSurfaceDirX, material.subSurfaceDirY, material.subSurfaceDirZ);
  }
  let outScatterDir = saturate(material.subSurfaceThreshold * dot(normal, L));

  // the eye vector in tangent space (toEyeTangent of the ZPass vertex shader)
  let toEyeTangent = toEye * tbn;
  let depthDetailUv = uv * material.subSurfaceTile + toEyeTangent.xy * material.subSurfaceParallax;
  let depthDetail = textureSample(heightMap, samplerLinear, depthDetailUv).x;
  let depthMask = fxFresnelApprox(toEye, normal, 0.0, material.subSurfaceFalloff, 1.0);

  let ssColor = material.subSurfaceColor.rgb;
  var scatter = ssColor + depthDetail * mix(ssColor, material.diffuseColor.rgb, material.subSurfaceDetailBlend) * material.subSurfaceDetailPow;
  scatter *= depthMask;
  return mix(scatter * material.subSurfaceDetailPow, albedo, saturate(outScatterDir + (1.0 - material.subSurfaceClarity)));
}

// forward shading (General pass), used by transparent materials
@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let s = fxSurface(input, false);

  var surface: SurfaceParams;
  surface.Diffuse   = s.albedo;
  surface.Alpha     = s.alpha;
  surface.Specular  = s.specular;
  surface.Roughness = smoothnessToRoughness(s.gloss);
  surface.Normal    = vec4f(s.normal, 1.0);

  var color = accumulateLight(lights, global, surface, s.toEye, input.worldPos);
  color = color + fxEmittance(s);

  var out: FragmentOutput;
  out.color = applyFog(color, s.alpha, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  let debugColor = fxDebugColor(input, s);
  if (debugColor.a >= 0.0) {
    out.color = debugColor;
  }
  return out;
}

// Material debug view (global.debug) of a surface. Alpha is -1 for modes without a material view.
fn fxDebugColor(input: FragmentInput, s: FxSurface) -> vec4f {
  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      return vec4f(s.albedo, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      return vec4f(s.specular, 1.0);
    }
    case DEBUG_MTL_METALLIC: {
      return vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_ROUGHNESS: {
      return vec4f(vec3f(smoothnessToRoughness(s.gloss)), 1.0);
    }
    case DEBUG_MTL_IOR: {
      return vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_EMISSIVE: {
      return vec4f(fxEmittance(s), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      return vec4f(vec3f(s.alpha), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      return vec4f(vec3f(s.sdf2d), 1.0);
    }
    // #endregion

    // #region Debug Geometry / Vectors
    case DEBUG_GV_NORMAL: {
      return vec4f(input.worldNormal.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_TANGENT: {
      return vec4f(input.worldTangent.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_BITANGENT: {
      return vec4f(input.worldBitangent.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_SHADE_NORMAL: {
      return vec4f(s.normal * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_POSITION_WS: {
      return vec4f(fract(input.worldPos.xyz), 1.0);
    }
    case DEBUG_GV_DEPTH: {
      return vec4f(vec3f(fract(linearizeDepthReversedZ(input.position.z, view.near, view.far))), 1.0);
    }
    // #endregion

    // #region Vertex attributes
    case DEBUG_V_COLOR0: {
      return vec4f(input.vertexColor.xyz, 1.0);
    }
    case DEBUG_V_UV0: {
      return vec4f(fract(s.uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      return vec4f(fract(s.uvEmittance), 0.0, 1.0);
    }
    case DEBUG_V_DEFORM: {
      if (material.deformWave1.w > 0) {
        return vec4f(1.0, 0.0, 1.0, 1.0);
      }
      return vec4f(-1.0);
    }
    // #endregion
    default: {
      return vec4f(-1.0);
    }
  }
}

struct DebugOutput {
  @location(0) color: vec4f,
};

// Material debug view of opaque surfaces, drawn over the lit image (NwRenderVariant.Debug). Modes without a
// material view draw nothing, the lighting pass shows the shading modes.
@fragment
fn fs_debug(input: FragmentInput) -> DebugOutput {
  let s = fxSurface(input, true);
  let color = fxDebugColor(input, s);
  if (color.a < 0.0) {
    discard;
  }
  var out: DebugOutput;
  out.color = color;
  return out;
}

// GetEmittance + frag_custom_end: emitted light, zero without an emissive color. Without %EMITTANCE_MAP only the
// fresnel glow emits.
fn fxEmittance(s: FxSurface) -> vec3f {
  if (getLuminance(material.emissiveColor.xyz) <= 0.0) {
    return vec3f(0.0);
  }
  var emittance = vec3f(0.0);
  if (EMITTANCE_MAP) {
    let sample = textureSample(emittanceMap, samplerLinear, s.uvEmittance.xy);
    emittance = sample.rgb * sample.a; // DEPRECATED: backwards compatibility (up to 3.8.3)
  }
  if (GLOW_FRESNEL) {
    emittance += vec3f(fxFresnelApprox(s.toEye, s.normal, material.fresnelInvert, material.fresnelExponent, material.fresnelStrength));
  }
  return emittance * getMaterialEmittance() * material.emissivescaleintensity;
}

struct EmissiveOutput {
  @location(0) color: vec4f,
};

// Emittance added to the deferred lit color (additive, after the lighting pass), see NwRenderVariant.Emissive
@fragment
fn fs_emissive(input: FragmentInput) -> EmissiveOutput {
  let s = fxSurface(input, true); // also the dissolve clip of the ZPass
  var out: EmissiveOutput;
  out.color = vec4f(fxEmittance(s), 0.0);
  return out;
}

// GBuffer attributes of opaque surfaces (ZPass). The emittance is added after the lighting by fs_emissive.
@fragment
fn fs_gbuffer(input: FragmentInput) -> GBufferOutput {
  let s = fxSurface(input, true);
  var g: GBufferSurface;
  g.normal        = s.normal;
  g.albedo        = s.albedo;
  g.reflectance   = s.specular;
  g.smoothness    = s.gloss;
  g.occlusion     = s.ao;
  g.lightingModel = LIGHTINGMODEL_STANDARD;
  g.transmittance = vec3f(0.0);
  return encodeGBuffer(g, linearizeDepthReversedZ(input.position.z, view.near, view.far));
}

fn getMaterialEmittance() -> vec3f {
  return material.emissiveColor.rgb * material.emissiveColor.a * EMITTANCE_TO_ENGINE_LIGHT_SCALE;
}

fn inverseScaleMatrix(worldMat: mat3x3f) -> mat3x3f {
  let twMat = transpose(worldMat);

  let scaleVec = vec3f(
    1.0 / dot(twMat[0], twMat[0]),
    1.0 / dot(twMat[1], twMat[1]),
    1.0 / dot(twMat[2], twMat[2])
  );

  let row0 = twMat[0] * scaleVec.x;
  let row1 = twMat[1] * scaleVec.y;
  let row2 = twMat[2] * scaleVec.z;

  return transpose(mat3x3f(row0, row1, row2));
}

fn fxSinWave( pos: vec3f, amp: f32, freq: f32, speed: f32, phase: f32, axis: f32, normal: vec3f ) -> vec3f {
  var newPos = vec3f(0.0, 0.0, 0.0);

  let sinWave = amp * sin(pos * freq + phase + (frame.elapsedTime * speed));

  if axis >= 0.0 && axis < 1.0 {
    newPos.x = sinWave.x * normal.x;
  }
  if axis >= 1.0 && axis < 2.0 {
    newPos.y = sinWave.y * normal.y;
  }
  if axis >= 2.0 && axis < 3.0 {
    newPos.z = sinWave.z * normal.z;
  }
  if axis == 3.0               {
    newPos = vec3f(sinWave.x, sinWave.y, sinWave.z) * normal;
  }

  return pos + newPos;
}

// FXFresnelApprox (FxLib.cfi)
fn fxFresnelApprox(view: vec3f, normal: vec3f, invert: f32, exponent: f32, power: f32) -> f32 {
  let approx = pow(saturate(dot(normalize(view), normalize(normal))), exponent) * power;
  let s = step(1.0 - 1e-7, invert);
  let a = saturate(approx);
  let b = 1.0 - saturate(approx);
  let c = a * (1.0 - s) + b * step(1.0, s);
  return c;
}
${COMMON_WGSL}
${GBUFFER_WGSL}
`
