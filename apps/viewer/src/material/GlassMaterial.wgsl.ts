import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct MaterialBlock {
  diffuseColor           : vec4f,
  specularColor          : vec4f,
  emissiveColor          : vec4f,

  bumpMapTile            : f32,   // default 1.0
  bumpScale              : f32,   // default 0.1
  tintColor              : vec4f, // default 1.0, 1.0, 1.0, 1.0
  backLightScale         : f32,   // default 0.5
  tintCloudiness         : f32,   // default 0.0
  indirectColor          : vec4f, // default 0.25, 0.25, 0.25, 0.25
  cloudinessReducesGloss : f32,   // default 0.5
  roughnessBoost         : f32,   // default 2.0
  blurAmount             : f32,   // default 0.5
  roughnessMaxFootprint  : f32,   // default 0.3
  fogDensity             : f32,   // default 1.0
  fogCutoffEnd           : f32,   // default 20.0
  fogColor               : vec4f, // default 1.0, 1.0, 1.0, 1.0
  depthFixupThreshold    : f32,   // default 0.05
  cloudinessMasksBlur    : f32,   // default 0.0

  // fresnelBias            : f32
  // fresnelScale           : f32

  sdf2DPhaseX             : f32, // number
  sdf2DPhaseY             : f32, // number
  sdf2DSpeedX             : f32, // number
  sdf2DSpeedY             : f32, // number
  sdf2DStrength           : f32, // number
  sdf2DTileX              : f32, // number
  sdf2DTileY              : f32, // number

  // sinewaveAmp             : f32, // number
  // sinewaveAxis            : f32, // number
  // sinewaveFreq            : f32, // number
  // sinewaveNormal          : f32, // number
  // sinewavePhase           : f32, // number
  // sinewaveSpeed           : f32, // number

  source2DPhaseX          : f32, // number
  source2DPhaseY          : f32, // number
  source2DSpeedX          : f32, // number
  source2DSpeedY          : f32, // number
  source2DTileX           : f32, // number
  source2DTileY           : f32, // number

  // --- Feature flags - 0=disabled, 1=enabled
  enabledTintColorMap            : u32,
  enabledBilinearFp16            : u32,
  enabledEnvironmentMap          : u32,
  enabledTintMap                 : u32,
  enabledDirtMap                 : u32,
  enabledSpecularMap             : u32,
  enabledBlurRefraction          : u32,
  enabledSaaFiltering            : u32,
  enabledDepthFog                : u32,
  enabledDepthFixup              : u32,
  enabledUnlit                   : u32,
  // feature flags that are currently not used by any material
  enabledBlendLayer              : u32,
  enabledDecal                   : u32,
  enabledDetailMapping           : u32,
  enabledDirtlayer               : u32,
  enabledEmittanceMap            : u32,
  enabledSignedDistanceField2d   : u32,
  enabledVertcolors              : u32,

  // enabledOffsetBumpMapping
  // enabledParallaxOcclusionMapping
  // enabledSilhouetteParallaxOcclusionMapping

// %ANISO_SPECULAR
// %BLENDLAYER_UV_SET_2
// %DETAIL_MAPPING_UV_SET_2
// %EMITTANCE_MAP_UV_SET_2
// %RIM_BLEND
// %RIM_DIFFUSE_LIGHTING
// %RIM_SPEC_LIGHTING
// %TEMP_EYES
// %TEMP_TERRAIN


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
// @block view
@group(1) @binding(5) var sceneColorMap      : texture_2d<f32>;

// --- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
@group(3) @binding(5) var translucencyMap    : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
@group(3) @binding(8) var subsurfaceMap      : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
@group(3) @binding(10)var normalMap2         : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11)var opacityMap         : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12)var smoothnessMap      : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13)var emittanceMap       : texture_2d<f32>; // $Emittance    (emittanceMap)
@group(3) @binding(14)var occlusionMap       : texture_2d<f32>; // $Occlusion    (OcclusionMap)
// @group(3) @binding(15)var specularMap2       : texture_2d<f32>; // $Specular2    (SpecularMap2)


struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3f,
  @location(1) color   : vec4f,
  @location(2) texture : vec2f,
  @location(3) normal  : vec3f,
  @location(4) tangent : vec4f,
};


struct FragmentInput {
  @builtin(position) position      : vec4f,
  @location(0)       worldPos      : vec3f,
  @location(1)       uvBase        : vec4f,
  @location(2)       uvBlend       : vec4f,
  @location(3)       uvEmittance   : vec4f,
  @location(4)       uvDetail      : vec4f,
  @location(5)       uvScreen      : vec4f,
  @location(6) @interpolate(perspective, centroid)       worldTangent  : vec4f,
  @location(7) @interpolate(perspective, centroid)       worldBitangent: vec3f,
  @location(8) @interpolate(perspective, centroid)       worldNormal   : vec3f,
  @location(9)       vertexColor   : vec4f,
  @location(10)      toEye         : vec3f,
  @location(11)      color         : vec4f,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  // --- Common
  let modelMatrix = object[input.id].modelMatrix;
  let worldPos    = modelMatrix * vec4f(input.position.xyz, 1.0);
  let viewPos     = view.viewMatrix * worldPos;
  var clipPos     = view.projectionMatrix * viewPos;
  let toEye       = normalize(view.cameraPosition - worldPos.xyz);
  let viewVec     = -toEye;


  var uvBase = vec4f(input.texture.xy, 0.0, 1.0);
  var uvBaseMod = uvBase;
  var uvBlend = uvBase;
  var uvEmittance = uvBase;
  var uvDetail = uvBase;

  // --- UV MOD DIFFUSE --
  if (material.enabledUvModDiffuse == TRUE) {
    uvBaseMod = material.uvModDiffuse * uvBase;
  }

  // --- UV MOD BLEND --
  if (material.enabledBlendLayer == TRUE) {
    var uv1 = uvBase; // The blend map uses unmodified texture coordinates from either uv set 1 or uv set 2
    var uv2 = uvBase; // The 2nd diffuse map, 2nd height map, etc. use a modified texture coordinate
    if (material.enabledUvModCustom == TRUE) {
      uv2 = material.uvModCustom * uv2;
    }
    uvBlend = vec4f(uv1.xy, uv2.xy);
  }

  // --- UV MOD EMITTANCE/EMISSIVE --
  if (material.enabledEmittanceMap == TRUE) {
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
    uvEmittance = vec4f(uv1.xy, uv2.xy);
  }

  // --- UV MOD DETAIL --
  if (material.enabledDetailMapping == TRUE) {
    uvDetail = material.uvModDetail * uvBase;
  }


  // --- TBN
  let rotScaleMat = mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  );
  let normalMat = inverseScaleMatrix(rotScaleMat);
  let vNormal   = input.normal.xyz;
  let vTangent  = input.tangent.xyz;
  // let vBitangent = cross(vNormal, vTangent) * input.tangent.w;

  let handedness = input.tangent.w;
  let tangent    = normalize(rotScaleMat  * vTangent);
  let normal     = normalize(normalMat    * vNormal);
  let bitangent  = cross(normal, tangent) * handedness;

  var output: FragmentInput;
  output.position       = clipPos;
  output.worldPos       = worldPos.xyz;
  output.worldNormal    = normal;
  output.worldTangent   = vec4f(tangent, handedness);
  output.worldBitangent = bitangent;
  output.color          = input.color;
  output.vertexColor    = input.color;
  output.toEye          = toEye;
  output.uvBase         = uvBaseMod;
  output.uvBlend        = uvBlend;
  output.uvDetail       = uvDetail;
  output.uvEmittance    = uvEmittance;
  output.uvScreen       = clipPosToSceenUv(clipPos);

  return output;
}
@fragment
fn fs_main(input: FragmentInput, @builtin(front_facing) isFront: bool) -> FragmentOutput {
  let time = frame.elapsedTime;

  let toEye = normalize(input.toEye);
  let tbn = mat3x3f(
    normalize(input.worldTangent.xyz),
    normalize(input.worldBitangent.xyz),
    normalize(input.worldNormal.xyz),
  );
  let invTBN = transpose(tbn);
  let viewTS = invTBN * toEye;
  let viewVec = -toEye;
  let viewDepth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  // --- UV
  var uvBase              = input.uvBase;
  var uvBlendMap          = input.uvBlend.xy;// * material.blendMaskTiling;
  var uvBlendLayer        = input.uvBlend.zw;// * material.blendLayer2Tiling;
  var uvEmittance         = input.uvEmittance.xy;
  var uvEmissiveIntensity = input.uvEmittance.zw;
  var uvBump              = input.uvBase.xy;
  var uvDetail            = input.uvDetail.xy;

  // --- Emittance + SDF + Source 2D
  var sdf2D = 0.0;
  if (material.enabledEmittanceMap == TRUE) {
    if (material.enabledSignedDistanceField2d == TRUE) {
      var uvSdf  = uvEmittance.xy;
          uvSdf *= vec2f(material.sdf2DTileX, material.sdf2DTileY);
          uvSdf += vec2f(
            material.sdf2DSpeedX * time + material.sdf2DPhaseX,
            material.sdf2DSpeedY * time + material.sdf2DPhaseY,
          );
      sdf2D = textureSample(heightMap, samplerLinear, uvSdf).r;

      uvEmittance *= vec2f(material.source2DTileX, material.source2DTileY);
      uvEmittance += vec2f(sdf2D);
      uvEmittance += vec2f(
        material.source2DSpeedX * time + material.source2DPhaseX,
        material.source2DSpeedY * time + material.source2DPhaseY,
      );
    }
  }

  // --- unify parameters
  // pPass.bCustomComposition = true;
  // pPass.bDontUseBump = true; // Ensures bumpmap doesn't get looked up twice (once in fraglib, once in glass)

  let fBackLightMul = 1.0 - (material.backLightScale * 2.0);
  let fRefrBumpScl = material.bumpScale;
  // pPass.bRenormalizeNormal = true;
  // pPass.bApplyGI = false;
  // pPass.pCustom.fDepth = -mul((float3x3)PerView_ViewMatr, pPass.IN.vView.xyz).z;

  // #if %ENVIRONMENT_MAP
  //   pPass.nReflectionMapping = REFLECT_CUBE;
  // #endif

  // #if %_RT_TILED_SHADING
  //   pPass.nReflectionMapping = 0;
  // #endif

  var normal = input.worldNormal;
  if (!isFront) {
    normal = -normal;
  }

  // --- frag_shared_output

  var cDiffuseMap = vec4f(0.0, 0.0, 0.0, 1.0);
  var cBumpMap = vec3f(0.0, 0.0, 1.0);

  // TODO: microtonality OBM/SPM/POM

  cDiffuseMap = textureSample(diffuseMap, samplerLinear, uvBase.xy);
  cBumpMap = decodeNormalMap(
    textureSample(normalMap, samplerLinear, uvBase.xy * material.bumpMapTile).xy,
    material.normalMapEncoding.xy,
  );


  if (material.enabledBlendLayer == TRUE) {
    // let cBumpMap2 = decodeNormal(textureSample(normalMap2, samplerLinear, uvBlendLayer.xy).xy);
    // cBumpMap = mix(cBumpMap, cBumpMap2, blendFac);
  }


  // --- Detail mapping
  // #if %DETAIL_MAPPING
  // float4 cDetailMap;
  // if (pPass.bDetailBumpMapping) <-- this is always false
  //   HINT: skipped. this part is skipped via boolean flag in original
  // }
  // #endif




  var albedo   = cDiffuseMap.rgb;
  var alpha    = cDiffuseMap.a; // * pPass.IN.Ambient.w;
  normal   = tbn * normalize(cBumpMap);
  normal.x+= 1e-6;
  normal   = normalize(normal);
  // from the bumped normal (frag_custom_begin recomputes it after the bump lookup)
  // pPass.vView points from the surface to the eye
  let fNdotE = dot(toEye, normal);

  // --- frag_custom_begin

  var tintMap = vec3f(1.0, 0.0, 1.0);
  var holes = 1.0; // no holes
  var specular = material.specularColor.rgb;
  var gloss    = material.specularColor.a;


  // --- Dirt Map
  if (material.enabledDirtMap == TRUE) {
    albedo *= material.diffuseColor.rgb;
    specular = mix(material.specularColor.rgb, vec3f(0.03), alpha);
  } else {
    albedo = vec3f(0.0);
    alpha = 0.0;
  }
  // diffuse (dirt) coverage, blends between the tinted background and the lit dirt
  let diffuseAlpha = alpha;

  // --- Specular Map / Tint Map
  if (material.enabledSpecularMap == TRUE) {
    tintMap = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;

    if (material.enabledTintMap == TRUE) {
      gloss *= saturate(1.0 - tintMap.y * material.cloudinessReducesGloss);
      specular = vec3f(tintMap.z);
    } else {
      specular = tintMap;
    }
  }

  gloss *= textureSample(smoothnessMap, samplerLinear, uvBase.xy).r;

  // --- Anisotropic Specular
  if (material.enabledSaaFiltering == TRUE) {
    // TODO
    // pPass.fGloss = RoughnessToSmoothness(GetKaplanyanRoughness(pPass.mTangentToWS, pPass.IN.screenProj, SmoothnessToRoughness(pPass.fGloss,0)));
  }

  // pPass.cShadowOcclMap.w = 1-ShadowDepthTest(pPass.IN.vView.xyz + PerView_WorldViewPos.xyz);

  // --- skipped, as already done above
  // pPass.cBumpMap = GetNormalMap(normalMap, normalMapSampler, pPass.IN.bumpTC.xy * BumpMapTile);
  // pPass.vNormal = normalize(mul(pPass.cBumpMap.xyz, pPass.mTangentToWS));
  // pPass.fNdotE = dot(pPass.vView.xyz, pPass.vNormal.xyz);
  // pPass.vReflVec = (2.0 * pPass.fNdotE * pPass.vNormal.xyz) - pPass.vView.xyz;

  let depthDims = vec2f(textureDimensions(sceneDepthMap, 0));
  let newNormal = normalize(vec3f(cBumpMap.xy * material.bumpScale * holes, 1.0));
  // refractionNormScale = 0.1 * PerView_HPosScale.xy, offset in screen uv
  let uvRefractionOffset = newNormal.xy * 0.1;
  var cBackbuffer = vec3f(0.0);
  var cRefraction = vec3f(0.0);

  // Get current pixel screen space coordinates
  var uvProj = input.uvScreen.xy / input.uvScreen.w;
  // sceneDepthMap holds linear view depth in world units (GetLinearDepth * far in the original)
  let refracPx = clamp(vec2i((uvProj + uvRefractionOffset) * depthDims), vec2i(0), vec2i(depthDims) - 1);
  let fZBufferRefrac = textureLoad(sceneDepthMap, refracPx, 0).r;
  // do not refract what is in front of the glass
  uvProj += uvRefractionOffset * saturate(fZBufferRefrac - viewDepth);

  // --- BLUR_REFRACTION
  if (material.enabledBlurRefraction == TRUE) {

    let tapCount: i32 = 37;
    let fScale: f32 = material.blurAmount * 0.003;

    var poisson: array<vec2<f32>, 37> = array<vec2<f32>, 37>(
      vec2f(-1.0 * fScale, 0.0),
      vec2f(-2.0 * fScale, 0.0),
      vec2f(-3.0 * fScale, 0.0),
      vec2f(0.0, 0.0),
      vec2f(3.0 * fScale, 0.0),
      vec2f(2.0 * fScale, 0.0),
      vec2f(1.0 * fScale, 0.0),
      // 7

      vec2f(-1.0 * fScale, -1.0 * fScale),
      vec2f(-2.0 * fScale, -1.0 * fScale),
      vec2f(-3.0 * fScale, -1.0 * fScale),
      vec2f(0.0, -1.0 * fScale),
      vec2f(3.0 * fScale, -1.0 * fScale),
      vec2f(2.0 * fScale, -1.0 * fScale),
      vec2f(1.0 * fScale, -1.0 * fScale),
      // 14

      vec2f(-1.0 * fScale, 1.0 * fScale),
      vec2f(-2.0 * fScale, 1.0 * fScale),
      vec2f(-3.0 * fScale, 1.0 * fScale),
      vec2f(0.0, 1.0 * fScale),
      vec2f(3.0 * fScale, 1.0 * fScale),
      vec2f(2.0 * fScale, 1.0 * fScale),
      vec2f(1.0 * fScale, 1.0 * fScale),
      // 21

      vec2f(-2.0 * fScale,  2.0 * fScale),
      vec2f(-1.0 * fScale,  2.0 * fScale),
      vec2f(0.0, 2.0 * fScale),
      vec2f(1.0 * fScale,  2.0 * fScale),
      vec2f(2.0 * fScale,  2.0 * fScale),
      // 26

      vec2f(-2.0 * fScale, -2.0 * fScale),
      vec2f(-1.0 * fScale, -2.0 * fScale),
      vec2f(0.0, -2.0 * fScale),
      vec2f(1.0 * fScale, -2.0 * fScale),
      vec2f(2.0 * fScale, -2.0 * fScale),
      // 31

      vec2f(-1.0 * fScale, 3.0 * fScale),
      vec2f(0.0, 3.0 * fScale),
      vec2f(1.0 * fScale, 3.0 * fScale),
      // 34

      vec2f(-1.0 * fScale, -3.0 * fScale),
      vec2f(0.0, -3.0 * fScale),
      vec2f(1.0 * fScale, -3.0 * fScale),
      // 37
    );

    var cAcc = vec3f(0.0, 0.0, 0.0);
    var mask = 1.0;

    if (material.enabledTintMap == TRUE) {
      mask = saturate(tintMap.y + (1.0 - material.cloudinessMasksBlur));
    }

    for (var t: i32 = 0; t < tapCount; t++) {
      cAcc += textureSample(sceneColorMap, samplerLinear, uvProj + poisson[t] * mask).rgb;
    }

    cAcc /= f32(tapCount);
    cBackbuffer = cAcc;
  } else {
    cBackbuffer = textureSample(sceneColorMap, samplerLinear, uvProj).rgb;
  }

  // --- DEPTH_FOG
  if (material.enabledDepthFog == TRUE) {
    // ComputeDepthFog: background depth relative to the glass, clamped to fade out against far away objects
    let backgroundZ = min(fZBufferRefrac - viewDepth, material.fogCutoffEnd);
    let fogLevel = saturate(exp2(-backgroundZ * material.fogDensity));
    cBackbuffer = mix(material.fogColor.rgb, cBackbuffer, fogLevel);
  }

  cRefraction = cBackbuffer;

  // #if %_RT_HDR_MODE && %_RT_FOG && !%_RT_DECAL_TEXGEN_2D && %_RT_VOLUMETRIC_FOG && !%_RT_MULTI_LAYER_ALPHA_BLEND
  // subtract volumetric fog color from refraction because fog between camera and glass is applied in frag_fog_setup function.
  //     VolumetricFogTexcoord vtc = GetVolumetricFogTexcoordParamByScreenProj(pPass.IN.screenProj);
  //     float4 vf = GetVolumetricFogValue(vtc);
  //     float4 globalFogColor = GetVolumetricFogAnalyticalColor(pPass.IN.vView.xyz).xyzw;
  //     float3 fogColor = 0.0f;
  //     ApplyVolumetricFog(vf, globalFogColor, vtc, fogColor.xyz);
  //     pPass.pCustom.cRefraction.xyz -= fogColor.xyz;
  // #endif

  alpha = 1.0;



  // --- Detail mapping
  // if (material.enabledDetailMapping != 0u) {
  //   albedo += albedo * cDetailMap.z;
  //   gloss  += gloss * cDetailMap.w;
  // }



  // --- Environment mapping
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


  if (material.enabledVertcolors == TRUE) {
    albedo *= input.vertexColor.rgb;
  }


  // --- Ambient occlusion ------------------------------------
  var ao = 1.0;
  // if (material.enabledOcclusionMap != 0u) {
  //   ao = textureSample(occlusionMap, samplerLinear, uvBase.xy).r;
  // }

  // if (pPass.bCustomComposition == false) {
  //   explicitly skipped, pPass.bCustomComposition is true
  //   frag_final_composition(pPass, cOut.xyz);
  // }

  var surface: SurfaceParams;
  // surface.Transmittance = vec4f(cShadingBack.rgb, material.normalViewDependency);
  surface.Diffuse   = albedo;
  surface.Alpha     = alpha;
  surface.Specular  = specular;
  surface.Normal    = vec4f(normal, 1.0);
  surface.Roughness = smoothnessToRoughness(gloss);

  var shade = accumulateLightShade(lights, global, surface, toEye, input.worldPos);
  // shade.ambient + shade.diffuseBack + shade.diffuse + shade.specular;

  // --- frag_ambient
  // TODO:

  var tintColor = material.tintColor.rgb;
  var tintCloudiness = material.tintCloudiness;
  var tintBackground = vec3f(0.0);
  var tintDiffuse = vec3f(0.0);
  var litDiffuse = vec3f(0.0);
  const decalWhiteTint = 0.45;
  const decalCloudiness = 0.45;
  // vertex colors only apply with %_RT_SAMPLE0 (impact decals)
  let vertColor = vec4f(1.0);

  if (material.enabledTintColorMap == TRUE) {
    tintColor *= textureSample(diffuseMap2, samplerLinear, uvBase.xy).rgb;
  }
  tintColor = saturate(tintColor * vertColor.rgb);// + vec3f(tintMap.w) * decalWhiteTint);

  if (material.enabledTintMap == TRUE) {
    tintCloudiness = saturate(tintCloudiness * tintMap.x * tintMap.y);// + tintMap.w * decalCloudiness);
    tintColor = saturate(tintColor.rgb + vec3f(1.0 - tintMap.x));
  } else {
    tintCloudiness = saturate(tintCloudiness);// + tintMap.w * decalCloudiness);
  }

  tintDiffuse = tintColor.rgb * (shade.diffuse.rgb + shade.ambient.rgb);
  litDiffuse = albedo * (shade.diffuse.rgb + shade.ambient.rgb);
  let fresnel = envmapFresnel(specular, gloss, fNdotE);

  // if (pPass.nReflectionMapping)
  // {
  //     pPass.cSpecularAcc.xyz += pPass.cEnvironment.xyz * fresnel;
  // }

  // #if %_RT_MULTI_LAYER_ALPHA_BLEND
  // #else
  tintBackground = cRefraction.rgb * tintColor.rgb;

  let tintBlend = mix(tintBackground, tintDiffuse, tintCloudiness);
  let cDiffuse = mix(tintBlend, litDiffuse, diffuseAlpha);
  let color = mix(cDiffuse, shade.specular, fresnel);

  // pPass.fAlpha = pPass.pCustom.fHoles * pPass.IN.Ambient.w;
  // pPass.fAlpha *= vertColor.a;
  // the refracted background is part of the color, the output replaces the scene (SrcBlend ONE, DestBlend ZERO)
  alpha = holes * vertColor.a;

  var out: FragmentOutput;
  out.color = applyFog(color, alpha, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  return out;
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

fn envmapFresnel(specCol0: vec3<f32>, gloss: f32, fNdotE: f32) -> vec3<f32> {
  let specCol90 = vec3<f32>(1.0, 1.0, 1.0);
  return mix(specCol0, specCol90, pow(1.0 - saturate(fNdotE), 5.0) / (40.0 - 39.0 * gloss));
}
${COMMON_WGSL}
`
