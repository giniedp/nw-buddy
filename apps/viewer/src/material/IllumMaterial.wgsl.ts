import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'
import { PROBES_WGSL } from './probes.wgsl'

/**
 * Material block, samplers and texture maps of the Illum material (groups 2 and 3).
 * Shared with the projected decal shader (IllumProjectedDecal.wgsl.ts), whose effects the IllumMaterial binds.
 */
export const ILLUM_MATERIAL_WGSL = /* wgsl */ `
struct MaterialBlock {
  // --- Base material color slots (c0–c2) ------------------
  diffuseColor     : vec4f,   // PerMaterial_DiffuseColor  .xyz=tint .w=opacity
  specularColor    : vec4f,   // PerMaterial_SpecularColor .xyz=F0   .w=smoothness scalar
  emissiveColor    : vec4f,   // PerMaterial_EmissiveColor .xyz=energy (non-zero gates emittance)
  detailTiling     : vec2f,   // PerMaterial_DetailTiling  .xy


  backDiffuseMultiplier: f32,   // default 1.0

  blendFactor          : f32,   // default 8.0  - sharpness exponent
  blendFalloff         : f32,   // default 32.0 - linear scale after power
  blendLayer2Diffuse   : vec4f, // default {1, 1, 1, 1}
  blendLayer2Smoothness: f32,   // default 10.0 (divided by 256 at use)
  blendLayer2Specular  : vec4f, // default {0.23, 0.23, 0.23, 0}
  blendLayer2Tiling    : f32,   // default 1.0
  blendMaskTiling      : f32,   // default 1.0

  colorMaskStrength    : f32, // default 0.0
  colorMaskOverride    : f32, // default 0.0
  colorMaskAlphaInf    : f32, // default 0.0

  decalFalloff         : f32,   // default 1.0
  decalAlphaMult       : f32,   // default 1.0
  decalDiffuseOpacity  : f32,   // default 1.0

  depthFixupThreshold  : f32,   // default 0.05

  detailBumpScale      : f32,   // default 0.5
  detailDiffuseScale   : f32,   // default 0.5
  detailGlossScale     : f32,   // default 0.5

  dissolveColor        : vec4f, // default {1, 1, 1, 1}
  dissolveEdgeThickness: f32,   // default 0.0
  dissolvePercentage   : f32,   // default 0.0

  emittanceMapGamma    : f32,   // default 1.0

  // fresnelBias                | number
  // fresnelPower               | number
  // fresnelScale               | number

  // glossFromDiffuseAmount     | number
  // glossFromDiffuseBrightness | number
  // glossFromDiffuseContrast   | number
  // glossFromDiffuseOffset     | number

  heightBias           : f32,   // default 1.0
  indirectColor        : vec3f, // default 0.25, 0.25, 0.25, 0.25
  transmittanceColor   : vec4f, // default {1, 1, 0.6, 1}

  maskR                : f32,   // default 0.0
  maskRColor           : vec3f, // default 0.0,0.0,0.0
  maskROverride        : f32,   // default 0.0

  maskG                : f32,   // default 0.0
  maskGColor           : vec3f, // default 0.0,0.0,0.0
  maskGOverride        : f32,   // default 0.0

  maskB                : f32,   // default 0.0
  maskBColor           : vec3f, // default 0.0,0.0,0.0
  maskBOverride        : f32,   // default 0.0

  maskAGloss            : f32,  // default 0.0
  maskAGlossShift       : f32,  // default 0.5
  maskASpecColor        : vec3f,// default 0.0,0.0,0.0
  maskASpecColorOverride: f32,  // default 0.0

  normalViewDependency : f32,   // default 0.0 surface thickness
  obmDisplacement      : f32,   // default 0.004
  pomDisplacement      : f32,   // default 0.025

  // rim_Blend_Center_Alpha     | number
  // rim_Blend_Center_Color     | vec4
  // rim_Blend_Color_Blend      | number
  // rim_Blend_Fill_Alpha       | number
  // rim_Blend_Fill_Color       | vec4
  // rim_Blend_Fill_Width       | number
  // rim_Blend_Major_Alpha      | number
  // rim_Blend_Major_Color      | vec4
  // rim_Blend_Major_Width      | number
  // rim_Blend_Smoothness       | number
  // rim_Center_Color           | vec4
  // rim_Center_Intensity       | number
  // rim_Color_Blend            | number

  rimMajorColor        : vec4f, // default 1.0, 1.0, 1.0, 1.0
  rimMajorIntensity    : f32,   // default 1.0
  rimMajorWidth        : f32,   // default 1.0
  rimFillIntensity     : f32,   // default 0.4
  rimFillWidth         : f32,   // default 1.0
  rimFillColor         : vec4f, // default 1.0, 1.0, 1.0, 1.0
  rimSmoothness        : f32,   // default 1.0
  rimColorBlend        : f32,   // default 0.1
  rimCenterColor       : vec4f, // default 1.0, 1.0, 1.0, 1.0
  rimCenterIntensity   : f32,   // default 0.0

  roughnessBoost       : f32,   // default 2.0
  roughnessMaxFootprint: f32,   // default 0.3
  selfShadowStrength   : f32,   // default 3.0
  sssIndex             : f32,   // default 0
  sssSpecularCutoff    : f32,   // default 1.0

  // tessellationDispBias       | number
  // tessellationFaceCull       | number
  // tessellationFactor         | number
  // tessellationFactorMax      | number
  // tessellationFactorMin      | number
  // tessellationHeightScale    | number

  alphaTestRef         : f32,

  // --- Feature flags - 0=disabled, 1=enabled -------------
  enabledAlphaBlend              : u32,
  enabledAlphaTest               : u32,

  // --- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  uvModCustom                    : mat4x4f,
  uvModDetail                    : mat4x4f,
  uvModEmittance                 : mat4x4f,
  uvModDecalEmissive             : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1
  enabledUvModCustom             : u32,     // _ModifyBlendLayerUV
  enabledUvModDetail             : u32,     // _ModifyDetailUV
  enabledUvModEmittance          : u32,     // _ModifyEmittanceUV
  enabledUvModDecalEmissive      : u32,     // _ModifyEmissiveMultiplierUV

  deformWave0                    : vec4f,
  deformWave1                    : vec4f,

  // xy = scale, bias of normalMap, zw = of normalMap2, by their texture formats (decodeNormalMap)
  normalMapEncoding              : vec4f,
};

@group(2) @binding(0) var<uniform>       material: MaterialBlock;

@group(2) @binding(1) var samplerLinear      : sampler;
@group(2) @binding(2) var samplerPoint       : sampler;

// --- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
//-@group(3) @binding(3) var envMap             : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
@group(3) @binding(5) var translucencyMap    : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
@group(3) @binding(8) var subsurfaceMap      : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
@group(3) @binding(10)var normalMap2         : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
@group(3) @binding(14) var occlusionMap      : texture_2d<f32>; // $Occlusion    (OcclusionMap)
@group(3) @binding(15) var specularMap2      : texture_2d<f32>; // $Specular2    (SpecularMap2)
`

export default /* wgsl */ `
${ILLUM_MATERIAL_WGSL}

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
// @private
@group(0) @binding(3) var<uniform>       lights  : LightBlock;
// @block global
// @private
@group(0) @binding(4) var envMap                 : texture_cube<f32>;

@group(1) @binding(0) var<storage, read> object       : array<ObjectBlock>; // per instance data
@group(1) @binding(1) var<storage, read> instanceData : array<InstanceDataBlock>; // per instance data

struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3f,
  @location(1) color   : vec4f,
  @location(2) texture : vec2f,
  @location(3) normal  : vec3f,
  @location(4) tangent : vec4f, // .w = handedness
  // skinned meshes (.skin bone mapping), a zero default for static meshes
  @location(5) joints  : vec4<u32>,
  @location(6) weights : vec4f,
};

struct FragmentInput {
  @builtin(position) position      : vec4f,
  @location(0)       worldPos      : vec3f,
  @location(1)       uvBase        : vec4f, // .xy=animated uv, .zw=original uv
  @location(2)       uvBlend       : vec4f,
  @location(3)       uvEmittance   : vec4f,
  @location(4)       uvDetail      : vec4f,
  @location(5) @interpolate(perspective, centroid)       worldTangent  : vec3f,
  @location(6) @interpolate(perspective, centroid)       worldBitangent: vec3f,
  @location(7) @interpolate(perspective, centroid)       worldNormal   : vec3f,
  @location(8)       vertexColor   : vec4f,
  @location(9)       viewVec       : vec3f,  // un-normalized; normalize in PS
  @location(10)      ambient       : vec4f,
  @location(11)      dissolve      : f32,
};

// decal z-fighting remedy of the game (%_VT_DEPTH_OFFSET for shaders with the "Decal" script flag, modificatorvt.cfi):
// r_ZFightingExtrude along the object space normal and r_ZFightingDepthScale on the clip position
const DECAL_Z_EXTRUDE: f32 = 0.001;
const DECAL_Z_SCALE: f32 = 0.995;

@vertex
fn vs_main(input : VertexInput) -> FragmentInput {

  let modelMatrix = object[input.id].modelMatrix;
  let skinned = skinVertex(
    instanceData[input.id].skinOffset, input.joints, input.weights, input.position, input.normal, input.tangent.xyz,
  );

  var vPos = skinned.position;
  if (material.deformWave1.w > 0) {
    var vmod: VertexMod;
    vmod.deformWave0 = material.deformWave0;
    vmod.deformWave1 = material.deformWave1;
    vmod.position = vPos;
    vmod.normal   = skinned.normal;
    vmod.color    = input.color.rgb;
    vmod.texture  = input.texture.xy;
    vmod.time     = frame.elapsedTime;
    vmod.typ      = u32(material.deformWave1.z);
    vPos = vertexModify(vmod);
  }

  if (DECAL) {
    vPos += skinned.normal * DECAL_Z_EXTRUDE;
  }

  let worldPos = modelMatrix * vec4f(vPos, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  if (DECAL) {
    // scales the view distance by DECAL_Z_SCALE, pulls the decal towards the camera
    clipPos = clipPos * DECAL_Z_SCALE + vec4f(0.0, 0.0, (1.0 - DECAL_Z_SCALE) * view.projectionMatrix[3][2], 0.0);
  }
  let toEye    = normalize(view.cameraPosition - worldPos.xyz);

  // --- TBN
  let normal    = normalize((modelMatrix * vec4f(skinned.normal,  0.0)).xyz);
  let tangent   = normalize((modelMatrix * vec4f(skinned.tangent, 0.0)).xyz);
  let bitangent = cross(normal, tangent) * input.tangent.w;

  var output: FragmentInput;
  output.position       = clipPos;
  output.worldPos       = worldPos.xyz;
  output.worldNormal    = normal;
  output.worldTangent   = tangent;
  output.worldBitangent = bitangent;
  output.viewVec        = toEye;
  output.vertexColor    = input.color;
  output.dissolve       = instanceData[input.id].dissolveAmount;
  let uvBase = vec4f(input.texture.xy, 0.0, 1.0);

  // --- UV MOD DIFFUSE --
  if (material.enabledUvModDiffuse == TRUE) {
    output.uvBase = material.uvModDiffuse * uvBase;
  } else {
    output.uvBase = uvBase;
  }

  // --- UV MOD BLEND --
  if (BLENDLAYER) {
    var uv1 = uvBase; // The blend map uses unmodified texture coordinates from either uv set 1 or uv set 2
    var uv2 = uvBase; // The 2nd diffuse map, 2nd height map, etc. use a modified texture coordinate
    if (material.enabledUvModCustom == TRUE) {
      uv2 = material.uvModCustom * uv2;
    }
    output.uvBlend = vec4f(uv1.xy, uv2.xy);
  }

  // --- UV MOD EMITTANCE/EMISSIVE --
  if (EMITTANCE_MAP) {
    // Both the emissive map and the emissive intensity map (from the decal overlay texture) use the same uv set
    // The emissive map and emissive intensity map each have their own independent modifier
    var uv1 = uvBase;
    var uv2 = uvBase;
    if (material.enabledUvModEmittance == TRUE) {
      uv1 = material.uvModEmittance * uv1;
    }
    if (material.enabledUvModDecalEmissive == TRUE) {
      uv2 = material.uvModDecalEmissive * uv2;
    }
    output.uvEmittance = vec4f(uv1.xy, uv2.xy);
  }

  // --- UV MOD DETAIL --
  if (DETAIL_MAPPING) {
    output.uvDetail = material.uvModDetail * uvBase;
  }

  return output;
}

// Surface attributes of a fragment, shared by the forward (fs_main) and gbuffer (fs_gbuffer) entry points
struct IllumSurface {
  toEye               : vec3f,
  albedo              : vec3f,
  alpha               : f32,
  normal              : vec3f,
  specular            : vec3f,
  gloss               : f32,
  authoredGloss       : f32, // before specular AA, for debug
  ao                  : f32,
  shadingBack         : vec3f, // transmittance color
  lightingModel       : u32,
  uvBase              : vec4f,
  uvEmittance         : vec2f,
  uvEmissiveIntensity : vec2f,
  detail              : vec4f, // detail map, for debug
};

// Samples and combines the material maps, applies alpha test, dissolve and specular AA (may discard)
fn illumSurface(input: FragmentInput) -> IllumSurface {
  // impostor fade in, distribution / vegetation fade out (DITHER_FADE_* constants)
  ditherFade(input.position.xy, distance(view.cameraPosition, input.worldPos), input.dissolve);

  let toEye = normalize(input.viewVec);
  let tbn = mat3x3f(
    normalize(input.worldTangent),
    normalize(input.worldBitangent),
    normalize(input.worldNormal),
  );
  let invTBN = transpose(tbn);
  let viewTS = invTBN * toEye;

  var uvBase              = input.uvBase;
  var uvBlendMap          = input.uvBlend.xy * material.blendMaskTiling;
  var uvBlendLayer        = input.uvBlend.zw * material.blendLayer2Tiling;
  var uvEmittance         = input.uvEmittance.xy;
  var uvEmissiveIntensity = input.uvEmittance.zw;
  // TODO: SIGNED_DISTANCE_FIELD_2D

  var uvBump              = input.uvBase.xy;
  var uvDetail            = input.uvDetail.xy;


  // #if %_RT_FOG ||%_RT_DECAL_TEXGEN_2D || %DECAL
  //   pPass.IN.Ambient = IN.Ambient;
  // #else
  //   pPass.IN.Ambient = 1.0;
  // #endif

  // pPass.IN.vTangent = IN.vTangent;
  // pPass.IN.vBinormal = IN.vBinormal;
  // pPass.IN.vNormal.xyz = (cross(IN.vTangent.xyz, IN.vBinormal.xyz)) * IN.vTangent.w;
  // pPass.IN.screenProj = IN.screenProj;
  // pPass.IN.vView = IN.vView;

  // #if %VERTCOLORS || %BLENDLAYER
  //   pPass.IN.Color = IN.Color;
  // #endif

  // #if %_RT_DECAL_TEXGEN_2D
  //     pPass.IN.DistAtten = IN.DistAtten;
  // #elif %_RT_FOG
  //     pPass.IN.AvgFogVolumeContrib = IN.AvgFogVolumeContrib;
  // #endif

  var nMicroDetailQuality = MICRO_DETAIL_QUALITY_DEF;
  var fBumpHeightScale = 0.0;
  var fHeightBias = material.heightBias;
  var fSelfShadowStrength = material.selfShadowStrength;

  if (PARALLAX_OCCLUSION_MAPPING) {
    nMicroDetailQuality = MICRO_DETAIL_QUALITY_POM;
    fBumpHeightScale = material.pomDisplacement;
  } else if (OFFSET_BUMP_MAPPING) {
    nMicroDetailQuality = MICRO_DETAIL_QUALITY_OBM;
    fBumpHeightScale = material.obmDisplacement;
  }

  // #if %VERTCOLORS
  //     pPass.bVertexColors = true;
  // #endif


  // #if %DETAIL_MAPPING
  //   pPass.bDetailBumpMapping = true;
  //   pPass.vDetailBumpTiling = float2(PerMaterial_DetailTiling.xy);
  //   pPass.fDetailBumpScale = DetailBumpScale;
  //   pPass.vDetailBlendAmount = float2(DetailDiffuseScale, DetailGlossScale);

  //   #if %ALPHAMASK_DETAILMAP
  //     pPass.bDetailBumpMappingMasking = true;
  //   #endif
  // #endif

  // --- Blend layer -- factor
  var blendFac = 0.0;
  if (BLENDLAYER) {
    let blendMapColor  = textureSample(opacityMap, samplerLinear, uvBlendMap.xy).r;
    blendFac = input.vertexColor.a * blendMapColor * (1 + material.blendFactor);
    blendFac = saturate(pow(abs(blendFac), material.blendFalloff));
  }
  // ---

  var cDiffuseMap = vec4f(0.0, 0.0, 0.0, 1.0);
  var cBumpMap = vec3f(0.0, 0.0, 1.0);

  switch (nMicroDetailQuality) {
    // case MICRO_DETAIL_QUALITY_OBM: {
      //     uv = ApplyOBM(uv, viewTS);

      // const float3 viewDir = mul(pPass.mTangentToWS, pPass.vView);
      // #if %BLENDLAYER
      //     const float4 newCoords = OffsetMap(microDetailBaseTC, pPass.IN.blendLayerTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
      //     pPass.IN.blendLayerTC = newCoords.zw;
      // #else
      //     const float4 newCoords = OffsetMap(microDetailBaseTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
      // #endif
      // pPass.IN.baseTC.xy = newCoords.xy;
      // pPass.IN.bumpTC.xy = newCoords.xy;
    // }
    // case MICRO_DETAIL_QUALITY_POM: {
    //     uv = ApplyPOM(uv, viewTS);
    // TODO:
    // }
    default: {
      cDiffuseMap = textureSample(diffuseMap, samplerLinear, uvBase.xy);
      cBumpMap = decodeNormalMap(textureSample(normalMap, samplerLinear, uvBase.xy).xy, material.normalMapEncoding.xy);

      if (BLENDLAYER) {
        let cBumpMap2 = decodeNormalMap(
          textureSample(normalMap2, samplerLinear, uvBlendLayer.xy).xy,
          material.normalMapEncoding.zw,
        );
        cBumpMap = mix(cBumpMap, cBumpMap2, blendFac);
      }
    }
  }

  // --- Detail Mapping --
  var cDetailMap = vec4f(0.0);
  if (DETAIL_MAPPING) {
    // detail tiling not applied in original
    // .ga = normal.xy, .rb = diffuse/gloss
    cDetailMap = textureSample(detailMap, samplerLinear, uvDetail).garb * vec4f(2.0) - vec4f(1.0);
    cDetailMap = cDetailMap * vec4f(
      material.detailBumpScale,
      material.detailBumpScale,
      material.detailDiffuseScale,
      material.detailGlossScale,
    );

    if (ALPHAMASK_DETAILMAP) {
      cDetailMap *= cDiffuseMap.a;
    }

    cBumpMap += vec3f(cDetailMap.xy, 0.0);
  }

  // pPass.fNdotE   = (dot(pPass.vView.xyz, pPass.vNormal.xyz));
  // pPass.vReflVec = (2.0 * pPass.fNdotE * pPass.vNormal.xyz) - pPass.vView.xyz;
  cDiffuseMap *= material.diffuseColor;

  var albedo   = cDiffuseMap.rgb;
  var alpha    = cDiffuseMap.a; // * pPass.IN.Ambient.w;
  var normal   = normalize(tbn * normalize(cBumpMap));
  // F0 without a specular map: the deferred ZPass (opaque, %DECAL) starts from the specular color
  // (clusterforward_commonzpass.cfi: cReflectance = PerMaterial_SpecularColor), the forward pass of blended
  // surfaces from zero (illum.cfx: (fragPass)0). %SPECULAR_MAP follows the Specular texture (IllumMaterial.ts).
  var specular = select(vec3f(1.0), vec3f(0.0), material.enabledAlphaBlend == TRUE && !DECAL);
  var gloss    = material.specularColor.a;

  // #if %RIM_DIFFUSE_LIGHTING || %RIM_SPEC_LIGHTING || %_RT_CLUSTER_FORWARD
  //     pPass.cBumpMap = GetNormalMap(normalMap, normalMapSampler, pPass.IN.bumpTC.xy);                                // 2 alu
  //     pPass.mTangentToWS = half3x3(pPass.IN.vTangent.xyz, pPass.IN.vBinormal.xyz, pPass.IN.vNormal.xyz);
  //     pPass.vNormal = mul(pPass.cBumpMap.xyz, pPass.mTangentToWS);                                  // 3 alu
  // #endif

  var cShadingBack = vec3f(0.0);
  var lightingModel = LIGHTINGMODEL_STANDARD;
  if (TRANSMITTANCE) {
    let cBackDiffuseMap = textureSample(opacityMap, samplerLinear, uvBase.xy).r;
    if (material.enabledAlphaBlend == TRUE) {
      // forward shading (clusterforward_defaultlighting.cfi)
      cShadingBack = material.backDiffuseMultiplier * cBackDiffuseMap * material.transmittanceColor.rgb;
    } else {
      // opaque surfaces go through the gbuffer (illum.cfx gbuffer attributes): the translucency is clamped,
      // higher normal view dependency makes bumped normals less translucent, simulating thickness
      let adjustedNormal = normalize(mix(normal, -tbn[2], material.normalViewDependency));
      let fTranslucency = material.backDiffuseMultiplier * cBackDiffuseMap * dot(adjustedNormal, normal);
      cShadingBack = saturate(fTranslucency) * material.transmittanceColor.rgb;
      lightingModel = LIGHTINGMODEL_TRANSMITTANCE;
    }
  }

  if (SPECULAR_MAP) {
    specular = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;
  }
  specular *= material.specularColor.rgb;
  // smoothness is served as a single channel texture (_ddna.dds.a)
  gloss    *= textureSample(smoothnessMap, samplerLinear, uvBase.xy).r;

  // %VERTCOLORS: the vertex alpha is part of the blended alpha (fades e.g. water floor edges and road decal ends).
  // It is not part of the alpha test, see below.
  if (VERTCOLORS) {
    alpha *= input.vertexColor.a;
  }

  if (DECAL) {
    alpha *= textureSample(opacityMap, samplerLinear, uvBase.zw).r;
    alpha = saturate(pow(alpha * material.decalAlphaMult, material.decalFalloff));
    // only in z prepass??
    // material.decalDiffuseOpacity;
  }
  // alpha = alpha * pPass.IN.Ambient.w;

  // --- Blend layer ------------------------------------------
  if (BLENDLAYER) {
    var diffuseMap2   = textureSample(diffuseMap2,     samplerLinear, uvBlendLayer.xy);
    var specularMap2  = textureSample(specularMap2,    samplerLinear, uvBlendLayer.xy);
    var glossLayer2   = textureSample(translucencyMap, samplerLinear, uvBlendLayer.xy).a;

    // Diffuse blend layer calculation
    diffuseMap2      *= vec4f(material.blendLayer2Diffuse.rgb, 1.0);
    albedo            = mix(albedo, diffuseMap2.rgb, blendFac);

    // Specular blend layer calculation
    specularMap2     *= vec4f(material.blendLayer2Specular.rgb, 1.0);
    specular          = mix(specular, specularMap2.rgb, blendFac);

    // Gloss blend layer calculation
    glossLayer2      *= (material.blendLayer2Smoothness / 256.0);
    gloss             = mix(gloss, glossLayer2, blendFac);
  }

  // --- Overlay mask -----------------------------------------
  // CharacterMasking.cfi, the mask texture is $CustomMap (MaskTex)
  if (OVERLAY_MASK) {
    let mask = textureSample(diffuseMap2, samplerLinear, uvBase.xy);
    let masked = applyOverlayMask(OverlayMaskSurface(albedo, specular, gloss), mask, illumOverlayMaskParams());
    albedo   = masked.albedo;
    specular = masked.specular;
    gloss    = masked.gloss;
  } else if (COLOR_SAMPLER_OVERLAY_MASK) {
    let mask = textureSample(diffuseMap2, samplerLinear, uvBase.xy);
    albedo = applyColorSamplerMask(albedo, mask, material.colorMaskStrength, material.colorMaskOverride, material.colorMaskAlphaInf);
  }

  // --- Alpha test (%_RT_ALPHATEST) --------------------------
  // tests the diffuse alpha only (cDiffuseMap.a in the original), not the vertex alpha or decal opacity:
  // meshes may store other data in the vertex alpha, e.g. the cottage stairs have 0 there
  if (material.enabledAlphaTest == TRUE && cDiffuseMap.a < material.alphaTestRef) {
    discard;
  }

  // --- Dissolve clip ----------------------------------------
  if (FX_DISSOLVE) {
    // the noise is the green channel of the blend map ($Opacity), %DECAL and %LEAVES use a constant 0.5
    var noise = 0.5;
    if (!DECAL && !LEAVES) {
      noise = textureSampleLevel(opacityMap, samplerLinear, uvBase.xy, 0.0).g;
    }
    albedo = clipDissolve(noise, material.dissolvePercentage, material.dissolveEdgeThickness, material.dissolveColor.rgb, albedo);
  }



  // --- Detail mapping
  if (DETAIL_MAPPING) {
    albedo += albedo * cDetailMap.z;
    gloss  += gloss * cDetailMap.w;
  }

  // --- Specular antialiasing
  let authoredGloss = gloss;
  let pixelPos  = vec2i(floor(input.position.xy));
  // only materials with %ALLOW_SPECULAR_ANTIALIASING, see illumvalidations.cfi
  if (SAA_FILTERING) {
    let r = getKaplanyanRoughness(tbn, pixelPos, smoothnessToRoughness(gloss), material.roughnessBoost, material.roughnessMaxFootprint);
    gloss = roughnessToSmoothness(r);
  }
  // the normal variance filter of the game (FilterGBufferPS) runs on the GBuffer, see FilterGBufferPass

  // #if %ENVIRONMENT_MAP
  //     if (pPass.nReflectionMapping > 0)
  //     {
  //         if (pPass.nReflectionMapping == REFLECT_CUBE)
  //         {
  //             pPass.cEnvironment = GetEnvironmentCMap(envMapCUBE, envMapCUBESampler, pPass.vReflVec.xyz, pPass.fGloss).xyz;
  //         }
  //         else
  //         if (pPass.nReflectionMapping == REFLECT_SPHERE)
  //         {
  //             // should be transformed to view space - but adds quite a lot instructions
  //             pPass.cEnvironment = GetEnvironment2DMap(envMap, envMapSampler, pPass.vReflVec.xy);
  //         }
  //     }
  // #endif





  // --- Ambient occlusion ------------------------------------
  var ao = 1.0;
  if (OCCLUSION_MAP) {
    ao = textureSample(occlusionMap, samplerLinear, uvBase.xy).r;
  }

  // %VERTCOLORS tints the diffuse color only (fraglib.cfi: cDiffuseMap.rgb *= IN.Color.rgb before lighting).
  // The vertex alpha is not part of the alpha (test), meshes may store other data in it.
  if (VERTCOLORS) {
    albedo *= input.vertexColor.rgb;
  }

  var s: IllumSurface;
  s.toEye               = toEye;
  s.albedo              = albedo;
  s.alpha               = alpha;
  s.normal              = normal;
  s.specular            = specular;
  s.gloss               = gloss;
  s.authoredGloss       = authoredGloss;
  s.ao                  = ao;
  s.shadingBack         = cShadingBack;
  s.lightingModel       = lightingModel;
  s.uvBase              = uvBase;
  s.uvEmittance         = uvEmittance;
  s.uvEmissiveIntensity = uvEmissiveIntensity;
  s.detail              = cDetailMap;
  return s;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let s = illumSurface(input);
  let toEye               = s.toEye;
  let normal              = s.normal;
  let albedo              = s.albedo;
  var alpha               = s.alpha;
  let specular            = s.specular;
  let gloss               = s.gloss;
  let authoredGloss       = s.authoredGloss;
  let ao                  = s.ao;
  let cShadingBack        = s.shadingBack;
  let lightingModel       = s.lightingModel;
  let uvBase              = s.uvBase;
  let uvEmittance         = s.uvEmittance;
  let uvEmissiveIntensity = s.uvEmissiveIntensity;
  let cDetailMap          = s.detail;

  // --- Environment mapping
  let reflectVec = normalize(reflect(-toEye, normal));
  let env = environmentLight(samplerLinear, lights, input.worldPos, normal, reflectVec, gloss, vec3f(0.0));

  var surface: SurfaceParams;
  surface.Transmittance = vec4f(cShadingBack.rgb, material.normalViewDependency);
  surface.LightingModel = lightingModel;
  surface.Diffuse   = albedo;
  surface.Alpha     = alpha;
  surface.Specular  = specular;
  surface.Normal    = vec4f(normal, 1.0);
  surface.Roughness = smoothnessToRoughness(gloss);

  let ambient = vec3f(ao);
  var shade = accumulateLightShade(lights, global, surface, toEye, input.worldPos);
  shade.ambient += env.diffuse * ambient;
  let envFresnel = environmentFresnel(surface.Specular.rgb, gloss, dot(normal, toEye));
  shade.specular += env.specular * ambient * envFresnel * shade.ambientScale;
  var color = composeShade(surface, shade);

  // --- Ambient / Environment --------------------------------
  // TODO:

  // --- Emittance and rim lighting ---------------------------
  let emittance = illumEmittance(s) + illumRimLighting(s);

  // --- Final composite --------------------------------------
  alpha = select(1.0, alpha, material.enabledAlphaBlend == TRUE);

  color = color + emittance;

  var out: FragmentOutput;
  out.color = applyFog(color, alpha, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  let debugColor = illumDebugColor(input, s);
  if (debugColor.a >= 0.0) {
    out.color = debugColor;
  }
  return out;
}

// Material debug view (global.debug) of a surface. Alpha is -1 for modes without a material view.
fn illumDebugColor(input: FragmentInput, s: IllumSurface) -> vec4f {
  let roughness = smoothnessToRoughness(s.gloss);
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
      return vec4f(vec3f(roughness), 1.0);
    }
    case DEBUG_SH_SPECULAR_AA: {
      // red = roughness added by specular AA, green = authored roughness
      let authored = smoothnessToRoughness(s.authoredGloss);
      return vec4f((roughness - authored) * 4.0, authored * 0.25, 0.0, 1.0);
    }
    case DEBUG_MTL_IOR: {
      return vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_EMISSIVE: {
      // what the additive glow pass adds: emittance and rim lighting
      return vec4f(illumEmittance(s) + illumRimLighting(s), 1.0);
    }
    case DEBUG_MTL_AO: {
      return vec4f(vec3f(s.ao), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      return vec4f(vec3f(select(1.0, s.alpha, material.enabledAlphaBlend == TRUE)), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      return vec4f(vec3f(s.gloss), 1.0);
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

    // #region Debug Vertex attributes
    case DEBUG_V_COLOR0: {
      return vec4f(input.vertexColor.rgb, 1.0);
    }
    case DEBUG_V_COLOR1: {
      return vec4f(s.detail.rgb, 1.0);
    }
    case DEBUG_V_UV0: {
      return vec4f(fract(s.uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      return vec4f(fract(input.uvBase.zw), 0.0, 1.0);
    }
    case DEBUG_V_UV3: {
      return vec4f(fract(s.uvEmittance), 0.0, 1.0);
    }
    case DEBUG_V_UV4: {
      return vec4f(fract(s.uvEmissiveIntensity), 0.0, 1.0);
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
  let s = illumSurface(input);
  let color = illumDebugColor(input, s);
  if (color.a < 0.0) {
    discard;
  }
  var out: DebugOutput;
  out.color = color;
  return out;
}

// Emitted light of a surface, zero without emittance
fn illumEmittance(s: IllumSurface) -> vec3f {
  var emittance = vec3f(0.0);
  let emissiveLum = getLuminance(material.emissiveColor.xyz);
  if (emissiveLum > 0.0) {

    var emitMapCol = vec4f(1.0);
    var emitMapInt = vec4f(0.5);
    if (EMITTANCE_MAP) {
      emitMapCol = textureSample(emittanceMap,     samplerLinear, s.uvEmittance.xy);
      emitMapInt = textureSample(decalEmissiveMap, samplerLinear, s.uvEmissiveIntensity.xy);
    }

    emittance = emitMapCol.rgb;
    emittance *= pow(max(getLuminance(emitMapCol.rgb), 1e-6), material.emittanceMapGamma - 1.0);
    emittance *= emitMapInt.rgb;
    emittance *= emitMapCol.a; // DEPRECATED
    emittance *= getMaterialEmittance();
  }
  return emittance;
}

struct EmissiveOutput {
  @location(0) color: vec4f,
};

// Emittance added to the deferred lit color (additive, after the lighting pass), see NwRenderVariant.Emissive
@fragment
fn fs_emissive(input: FragmentInput) -> EmissiveOutput {
  let s = illumSurface(input);
  var out: EmissiveOutput;
  out.color = vec4f(illumEmittance(s) + illumRimLighting(s), 0.0);
  return out;
}

// GBuffer attributes of opaque surfaces (illum.cfx ZPass), lit by the deferred lighting pass
@fragment
fn fs_gbuffer(input: FragmentInput) -> GBufferOutput {
  let s = illumSurface(input);
  var g: GBufferSurface;
  g.normal        = s.normal;
  g.albedo        = s.albedo;
  g.reflectance   = s.specular;
  g.smoothness    = s.gloss;
  g.occlusion     = s.ao;
  g.lightingModel = s.lightingModel;
  g.transmittance = select(vec3f(0.0), s.shadingBack, s.lightingModel == LIGHTINGMODEL_TRANSMITTANCE);
  return encodeGBuffer(g, linearizeDepthReversedZ(input.position.z, view.near, view.far));
}

struct GBufferDecalOutput {
  @location(0) a: vec4f,
  @location(1) b: vec4f,
  @location(2) c: vec4f,
};

// %DECAL materials blended into the GBuffer after the opaque surfaces (ZPass decal list, commonzpass.cfi):
// SRC_ALPHA / INV_SRC_ALPHA with color mask RGB on A, B and C (the effect's renderBlends / renderMasks), the alpha of
// each target is its blend factor (SetGBufferBlending(fAlpha, fAlpha * DecalDiffuseOpacity, fAlpha)). The .w channels
// of the surface below (lighting model, occlusion, chroma) are kept. %DECAL: reflectance as its luminance.
@fragment
fn fs_gbuffer_decal(input: FragmentInput) -> GBufferDecalOutput {
  let s = illumSurface(input);
  var g: GBufferSurface;
  g.normal        = s.normal;
  g.albedo        = s.albedo;
  g.reflectance   = vec3f(dot(s.specular, vec3f(0.2126, 0.7152, 0.0722)));
  g.smoothness    = s.gloss;
  g.occlusion     = 1.0;
  g.lightingModel = LIGHTINGMODEL_STANDARD;
  g.transmittance = vec3f(0.0);
  let e = encodeGBuffer(g, 0.0);
  let alpha = saturate(s.alpha);
  var out: GBufferDecalOutput;
  out.a = vec4f(e.a.rgb, alpha);
  out.b = vec4f(e.b.rgb, alpha * material.decalDiffuseOpacity);
  out.c = vec4f(e.c.rgb, alpha);
  return out;
}

// =============================================================
// Helpers - Specular AA (Kaplanyan 2016)
// =============================================================
fn ApplySAAFiltering(roughness: f32) -> f32 {
    // Variance-based roughness boost from normal map frequency content.
    // Approximated here as a constant boost; full version needs ddx/ddy of normals.
    let boosted = sqrt(roughness * roughness + material.roughnessBoost * 0.01);
    return clamp(boosted, roughness, material.roughnessMaxFootprint);
}

// Reoriented Normal Mapping blend (better than simple XY-add for large angles)
fn BlendNormalsRNM(base: vec3f, detail: vec3f) -> vec3f {
    let t = base   + vec3f(0.0, 0.0, 1.0);
    let u = detail * vec3f(-1.0, -1.0, 1.0);
    return normalize(t * dot(t, u) - u * t.z);
}

// Single-step offset bump mapping
fn ApplyOBM(uv: vec2f, viewTS: vec3f) -> vec2f {
    let h      = textureSampleLevel(heightMap, samplerLinear, uv, 0.0).r;
    let offset = (h - material.heightBias) * material.obmDisplacement;
    return uv + viewTS.xy * offset;
}

// Iterative POM: 16-step linear search + secant refinement
fn ApplyPOM(uv: vec2f, viewTS: vec3f) -> vec2f {
    let N         = 16;
    let stepDepth = 1.0 / f32(N);
    let uvStep    = (-viewTS.xy / max(abs(viewTS.z), EPSILON))
                  * material.pomDisplacement / f32(N);

    var curUV    = uv;
    var prevUV   = uv;
    var curDepth = 0.0;
    var prevH    = textureSampleLevel(heightMap, samplerLinear, uv, 0.0).r;
    var curH     = prevH;

    for (var i = 0; i < N; i++) {
        prevH    = curH;
        prevUV   = curUV;
        curUV   += uvStep;
        curDepth += stepDepth;
        curH = textureSampleLevel(heightMap, samplerLinear, curUV, 0.0).r;
        // CryFX: break when NB1 >= height (height = 1 - step*i, decreasing threshold).
        // Height map: 1=raised, 0=recessed. Intersection when h >= (1 - curDepth).
        if (curH >= 1.0 - curDepth) {
          break;
        }
    }

    // Secant refinement: solve for where (1 - depth) == h between the two bracketing samples.
    let prevDepth = curDepth - stepDepth;
    let e0 = (1.0 - prevDepth) - prevH;  // > 0: no intersection before this step
    let e1 = (1.0 - curDepth)  - curH;   // <= 0: intersection at or before this step
    let t  = e0 / max(e0 - e1, EPSILON);
    return mix(prevUV, curUV, t);
}


fn illumRimParams() -> RimParams {
  return RimParams(
    material.rimMajorColor.rgb, material.rimMajorIntensity, material.rimMajorWidth,
    material.rimFillColor.rgb, material.rimFillIntensity, material.rimFillWidth,
    material.rimColorBlend, material.rimSmoothness,
    material.rimCenterColor.rgb, material.rimCenterIntensity,
  );
}

// %RIM_DIFFUSE_LIGHTING / %RIM_SPEC_LIGHTING: added to the emittance (illum.cfx frag_custom_end).
// The rim map is $CustomSecondaryMap (normalMap2) .r.
fn illumRimLighting(s: IllumSurface) -> vec3f {
  if (!(RIM_DIFFUSE_LIGHTING || RIM_SPEC_LIGHTING)) {
    return vec3f(0.0);
  }
  let p = illumRimParams();
  if (!rimLightingActive(p)) {
    return vec3f(0.0);
  }
  let rimMap = textureSample(normalMap2, samplerLinear, s.uvBase.xy).r;
  let light = rimLight(s.normal, s.toEye, p, rimMap);
  return rimLightingDefault(s.normal, s.toEye, s.gloss, s.specular, light, RIM_DIFFUSE_LIGHTING, RIM_SPEC_LIGHTING);
}

fn illumOverlayMaskParams() -> OverlayMaskParams {
  return OverlayMaskParams(
    material.maskR, material.maskRColor, material.maskROverride,
    material.maskG, material.maskGColor, material.maskGOverride,
    material.maskB, material.maskBColor, material.maskBOverride,
    material.maskAGloss, material.maskAGlossShift, material.maskASpecColor, material.maskASpecColorOverride,
  );
}

fn getMaterialEmittance() -> vec3f {
  return material.emissiveColor.rgb * material.emissiveColor.a * EMITTANCE_TO_ENGINE_LIGHT_SCALE;
}

${COMMON_WGSL}
${GBUFFER_WGSL}
${PROBES_WGSL}
`
