import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'

export default /* wgsl */ `
${COMMON_WGSL}
${GBUFFER_WGSL}

struct MaterialBlock {
  diffuseColor  : vec4f,
  specularColor : vec4f,
  emissiveColor : vec4f,

  transmittanceColor    : vec4f, // default {1, 1, 0.6, 1}

  capOpacityFalloff     : f32, // default 1.0
  normalViewDependency  : f32, // default 0.5
  backDiffuseMultiplier : f32, // default 1.0
  blendTerrainCol       : f32, // default 0.0

  blendTerrainColDist   : f32, // default 0.5
  detailBumpScale       : f32, // default 0.5
  detailDiffuseScale    : f32, // default 0.5
  detailGlossScale      : f32, // default 0.5

  blendMaskTiling       : f32, // default 1.0
  emittanceMapGamma     : f32, // default 1.0

  blendFactor           : f32, // default 8.0
  blendLayer2Tiling     : f32, // default 1.0
  blendFalloff          : f32, // default 32.0
  blendLayer2Smoothness : f32, // default 10.0

  alphaTestRef                   : f32,

  heightBias                     : f32,    // default 1.0  — center height; offset = (h - bias) × scale
  heightScale                    : f32,    // default 0.004 — UV displacement amount (obmDisplacement)
  detailTiling                   : vec2f,  // PerMaterial_DetailTiling.xy — scales detail UV
  blendTerrainColInfo            : vec4f, // .xy = terrain UV offset, .z = UV scale, .w = blend distance


  enabledAlphaBlend              : u32,
  enabledAlphaTest               : u32,
  enabledTerrainBlend            : u32,   // %_RT_BLEND_WITH_TERRAIN_COLOR

  // -- Texture modifier matrices
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

  // %DETAIL_BENDING (ModificatorVT.cfi)
  bendDetailFrequency            : f32,   // default 1.0
  bendDetailLeafAmplitude        : f32,   // default 0.2
  bendDetailBranchAmplitude      : f32,   // default -0.5
  // 1 when the material receives wind on ordinary meshes (authored nonzero leaf or branch amplitude), else 0
  receiveWind                    : f32,

  // xy = scale, bias of normalMap, zw = of normalMap2, by their texture formats (decodeNormalMap)
  normalMapEncoding              : vec4f,
};

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

// -- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
// @group(3) @binding(5) var translucencyMap : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
// @group(3) @binding(8) var subsurfaceMap   : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
@group(3) @binding(10)var normalMap2         : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11) var opacityMap        : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12) var smoothnessMap     : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
// @group(3) @binding(14) var occlusionMap   : texture_2d<f32>; // $Occlusion    (OcclusionMap)
@group(3) @binding(15) var specularMap2      : texture_2d<f32>; // $Specular2    (SpecularMap2)
@group(3) @binding(16) var fromObjTex        : texture_2d<f32>; // $FromObj  terrain color



struct VertexInput {
  @builtin(instance_index) id   : u32,
  @location(0) position         : vec3f,
  @location(1) normal           : vec3f,
  @location(2) texture          : vec4f, // .xy = uv0, .zw = uv1
  @location(3) color            : vec4f,
  @location(4) tangent          : vec4f, // .w = handedness sign
};

struct FragmentInput {
  @builtin(position) position   : vec4f,
  @location(0) toEye            : vec3f, // cameraPosition - worldPos
  @location(1) worldPos         : vec3f, // world space position
  @location(2) @interpolate(perspective, centroid) worldTangent     : vec4f, // .xyz = world tangent,   .w = handedness
  @location(3) @interpolate(perspective, centroid) worldBitangent   : vec3f, // .xyz = world bitangent
  @location(4) @interpolate(perspective, centroid) worldNormal      : vec3f, // .xyz = world normal
  @location(5) uvBase           : vec4f, //
  @location(6) uvBlend          : vec4f, // unused
  @location(7) uvEmittance      : vec4f, // .xy = emittance UV, .zw = intensity UV
  @location(8) uvDetail         : vec4f,

  @location(9)  color0          : vec4f, // .x= render quality, .y= alpha blend term, .z = wsNormal.z component, .w = alpha
  @location(10) vertColor       : vec4f, // pass-through vertex color
  @location(11) backLight       : vec3f,
  @location(12) frontLight      : vec3f,
};

// --- Wind: detail bending (ModificatorVT.cfi _VTBending / _DetailBending) -------------------------------------------

// beyond this camera distance the bending fades out (IMPOSTOR_MIN_VIEW_DISTANCE = PerFrame_FogDistanceScale.y, 185 in
// the GPA captures, IMPOSTOR_VISIBILITY_START in constants.ts)
const BEND_FADE_DISTANCE: f32 = 185.0;
// PerFrame_VegetationFading.w: wind scale of branches above the player height (2 m), 0.5 in the GPA captures
const BEND_TREE_WIND_SCALE: f32 = 0.5;

fn triangleWave(x: vec4f) -> vec4f {
  return abs(fract(x + 0.5) * 2.0 - 1.0);
}

// SimpleWindNoise: wind gusts over the world
fn simpleWindNoise(worldPos: vec2f, time: f32) -> f32 {
  var waves = worldPos.xyxy * vec4f(0.3, 0.2, 0.1, 0.02);
  waves += time * vec4f(1.0, 0.3, 0.1, 0.1);
  waves = triangleWave(waves);
  // the slow layers only contribute 70% and 30% of the time
  waves = vec4f(waves.xy, saturate(waves.zw - vec2f(0.3, 0.7)) / vec2f(0.7, 0.3));
  return saturate(dot(waves, vec4f(1.0, 1.0, 6.0, 10.0)) / 14.0);
}

// Bending strength of the baked vegetation records (region.vegetation, VegetationBatch): the asset's descriptor
// Bending (byte / 100, mostly 0.1), InstBendInfo.w of the record. Negative for all other meshes.
override VEGETATION_BENDING: f32 = -1.0;

// SBending::GetShaderConstants w of ordinary meshes the global wind
// scaled by 0.25 and soft clamped to 2, times 0.3. The distance attenuation is 1 (the game reads the render object
// distance before it is written). The small wave term is left out.
fn meshWindBendSpeed(wind: vec4f) -> f32 {
  let q = wind.xy * 0.25;
  let softening = 2.0 / (length(q) + 2.0);
  return length(q * softening) * 0.3;
}

// Leaf edge and branch flutter, by the vertex colors: r = edge stiffness, g = branch phase, b = branch bend amount
// (inverted). Object space (z up). The wind speed is vBendingInfo.w: the baked vegetation records pass
// Bending * PerFrame_WindDirection.w, ordinary meshes the SBending w when the material receives wind.
// The main (whole object) bending is not ported.
fn detailBending(pos: vec3f, normal: vec3f, color: vec3f, instancePos: vec3f, time: f32) -> vec3f {
  let camDelta = instancePos.xy - view.cameraPosition.xy;
  let distanceSqr = dot(camDelta, camDelta);
  let fadeSqr = BEND_FADE_DISTANCE * BEND_FADE_DISTANCE;
  let distanceScale = 1.0 - saturate((distanceSqr * distanceSqr) / (fadeSqr * fadeSqr));

  var bendSpeed = material.receiveWind * meshWindBendSpeed(global.windDirection);
  if (VEGETATION_BENDING >= 0.0) {
    bendSpeed = VEGETATION_BENDING * global.windDirection.w;
  }
  var speed = bendSpeed * simpleWindNoise(instancePos.xy, time);
  if (GRASS) {
    speed *= saturate(pos.z);
  }
  speed *= mix(1.0, BEND_TREE_WIND_SCALE, saturate(pos.z - 2.0));

  let leafAmp = material.bendDetailLeafAmplitude * distanceScale;
  let branchAmp = material.bendDetailBranchAmplitude * distanceScale;
  let edgeAtten = color.r;
  let branchAtten = 1.0 - color.b;

  // phases: object, vertex, branch
  let branchPhase = color.g + dot(instancePos, vec3f(2.0));
  let vtxPhase = dot(pos, vec3f(branchPhase));
  let wavesIn = vec2f(time) + vec2f(vtxPhase, branchPhase);
  var waves = (fract(wavesIn.xxyy * vec4f(1.2, 0.793, 0.375, 0.193)) * 2.0 - 1.0) * material.bendDetailFrequency * speed;
  waves = triangleWave(waves);
  // x: edges, y: branches
  let sum = waves.xz + waves.yw;
  return pos + sum.xxy * vec3f(edgeAtten * leafAmp * normal.xy, branchAtten * branchAmp);
}

@vertex
fn vs_main(input : VertexInput) -> FragmentInput {


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

  let modelMatrix = object[input.id].modelMatrix;
  // vegetation.cfx: %GRASS and %LEAVES always bend
  if (DETAIL_BENDING || LEAVES || GRASS) {
    vPos = detailBending(vPos, input.normal, input.color.rgb, modelMatrix[3].xyz, frame.elapsedTime);
  }
  let worldPos = modelMatrix * vec4f(vPos, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  let toEye    = view.cameraPosition - worldPos.xyz;
  let view     = -toEye;

  var output : FragmentInput;

  // -- TBN
  var normal    = normalize((modelMatrix * vec4f(input.normal,          0.0)).xyz);
  let tangent   = normalize((modelMatrix * vec4f(input.tangent.xyz,     0.0)).xyz);
  let bitangent = cross(normal, tangent) * input.tangent.w;
  var handedness = input.tangent.w;

  // #region UV Modifiers
  // -- UV MOD DIFFUSE --
  if (material.enabledUvModDiffuse == TRUE) {
    output.uvBase = input.texture * material.uvModDiffuse;
  } else {
    output.uvBase = input.texture;
  }

  // -- UV MOD BLEND --
  // not used, calculated in fragment shader

  // -- UV MOD DETAIL --
  if (DETAIL_MAPPING) {
    output.uvDetail = input.texture * material.uvModDetail;
  }

  // -- UV MOD EMITTANCE/EMISSIVE --
  if (EMITTANCE_MAP) {
    // uses premodified UVs
    // TODO: figure out whether this is intentional or by accident
    var uv1 = output.uvBase;
    var uv2 = output.uvBase;

    if (material.enabledUvModEmittance == TRUE) {
      uv1 = uv1 * material.uvModEmittance;
    }
    if (material.enabledUvModDecalEmissive == TRUE) {
      uv2 = uv2 * material.uvModDecalEmissive;
    }
    output.uvEmittance = vec4f(uv1.xy, uv2.xy);
  }
  // #endregion

  var ambientObjectOcclusion = vec4f(1.0);
  // #if %_RT_INSTANCING_ATTR
	//   AmbObjectCol = float4(1,1,1,1);
  // #else
  //   AmbObjectCol = AmbientObjectCol;
  // #endif
  // using sign gives a better visual result, but pops (vegetation.cfx)
  let flipN = min(dot(normalize(toEye), normal) + 0.1, 1.0);
  if (LEAVES || GRASS) {
    normal     *= flipN;
    handedness *= flipN;
  }
  if (GRASS) {
    // global.sunDirection points away from the sun (PerFrame_SunDirection towards it)
    output.frontLight = vec3f(saturate(dot(-global.sunDirection.xyz, normal)));
  }

  output.color0 = vec4f(
    ambientObjectOcclusion.w, // render quality
    ambientObjectOcclusion.y, // alpha blend term
    normal.z * 0.25 + 0.75,   // world normal Z
    1.0
  );

  var alpha = input.color.a;
  if (BLENDLAYER) {
    // blend layer vtx alpha overlaps with alpha on vegetation. Use blue channel instead
    alpha = input.color.z;
    output.color0.z = input.color.a;
  }
  // #if !%_RT_BLEND_WITH_TERRAIN_COLOR
  //   #if !%_RT_FOG
  //   fAlpha *= AmbObjectCol.x;
  //   #endif
  // #endif
  output.color0.w = alpha;

  // -- Back lighting for leaves and grass ------------------------------------------------
  if (LEAVES || GRASS) {
    var backDiffuse = vec3f(material.backDiffuseMultiplier) * output.color0.x; // render quality
    if (LEAVES) {
      output.backLight = backDiffuse;
    } else {
      // ??? why multiply, if default value is 0.0?
      output.backLight *= backDiffuse;
    }
  }

  // -- Terrain blend UVs ---------------------------------------------------------------
  if (material.enabledTerrainBlend == TRUE) {
    let tcInfo = material.blendTerrainColInfo;
    let camDist   = length(view);
    let blendDist = tcInfo.w * (1.0 - material.blendTerrainColDist);
    let blendFac  = saturate(material.blendTerrainCol + camDist / max(blendDist, 0.001));
    // clipPos.z = blendFac * blendFac;
    // OUT.screenProj.z =  fBlendFactor*fBlendFactor; // TODO
    output.uvBase.z = tcInfo.z * worldPos.y + tcInfo.x;
    output.uvBase.w = tcInfo.z * worldPos.x + tcInfo.y;
  }

  output.position        = clipPos;
  output.worldPos        = worldPos.xyz;
  output.worldTangent    = vec4f(tangent, handedness);
  output.worldBitangent  = bitangent;
  output.worldNormal     = normal;
  output.vertColor       = input.color;
  output.toEye           = toEye;

  return output;
}

// Surface attributes of a fragment, shared by the forward (fs_main) and gbuffer (fs_gbuffer) entry points
struct VegetationSurface {
  toEye               : vec3f,
  normal              : vec3f,
  albedo              : vec3f,
  alpha               : f32,
  specular            : vec3f,
  gloss               : f32,
  authoredGloss       : f32, // before specular AA, for debug
  shadingBack         : vec3f, // forward back light (vertex back light x opacity)
  frontLight          : vec3f, // forward grass front light
  opacity             : f32,   // opacity map (leaves translucency), 1 otherwise
  uvBase              : vec4f,
  uvEmittance         : vec2f,
  uvEmissiveIntensity : vec2f,
};

// Samples and combines the material maps, specular AA and alpha test (may discard)
fn vegetationSurface(input: FragmentInput) -> VegetationSurface {
  // impostor fade in, distribution / vegetation fade out (DITHER_FADE_* constants)
  ditherFade(input.position.xy, distance(view.cameraPosition, input.worldPos), 1.0);

  var wTangent = normalize(input.worldTangent.xyz);
  var wBitangent = normalize(input.worldBitangent.xyz);
  var wNormal = normalize(input.worldNormal.xyz);
  if (!GRASS) {
    wNormal = cross(wTangent, wBitangent) * input.worldTangent.w;
  }

  let toEye  = normalize(input.toEye);
  let tbn    = mat3x3f(wTangent, wBitangent, wNormal);
  let invTBN = transpose(tbn);
  let viewTS = invTBN * toEye;

  var uvBase              = input.uvBase;
  var uvBump              = input.uvBase.xy;
  var uvDetail            = input.uvDetail.xy;
  var uvEmittance         = input.uvEmittance.xy;
  var uvEmissiveIntensity = input.uvEmittance.zw;
  var uvBlendMap          = input.uvBase.xy;
  var uvBlendLayer        = input.uvBase.xy;
  if (material.enabledUvModCustom == TRUE) {
    uvBlendLayer = (input.uvBase * material.uvModCustom).xy;
  }
  var nMicroDetailQuality = MICRO_DETAIL_QUALITY_DEF;
  var fBumpHeightScale = 0.0;
  // var fHeightBias = material.heightBias;
  // var fSelfShadowStrength = material.selfShadowStrength;

  var cBackLight = vec3f(0.0);
  var cFrontLight = vec3f(0.0);
  var cShadingBack = vec3f(0.0);
  if (LEAVES || GRASS) {
    cBackLight = input.backLight;
  }
  if (GRASS) {
    cFrontLight = input.frontLight.rgb * global.sunColor.rgb;
  }
  // #if %_RT_FOG
  //   pPass.IN.AvgFogVolumeContrib = IN.AvgFogVolumeContrib;
  // #endif

  // --
  // #region frag_unify_parameters(pPass);

  // pPass.bCustomComposition = true;
  // pPass.bRenormalizeNormal = true;
  // pPass.bDeferredSpecularShading = true;
  // pPass.pCustom.fRenderQuality = pPass.pCustom.cColor0.x;
  // #if %DETAIL_MAPPING
  //   pPass.bDetailBumpMapping = true;
  //   pPass.vDetailBumpTiling = float2(PerMaterial_DetailTiling.xy);
  //   pPass.fDetailBumpScale = DetailBumpScale;
  //   pPass.vDetailBlendAmount = float2(DetailDiffuseScale, DetailGlossScale);
  // #endif
  // #endregion
  // --

  // --
  // #region frag_shared_output

  // -- TODO: frag_get_deferred_buffers(pPass)

  // -- Blend layer factor --
  var blendFac = 0.0;
  if (BLENDLAYER) {
    let blendMapColor  = textureSample(opacityMap, samplerLinear, uvBlendMap.xy).r;
    blendFac = input.vertColor.a * blendMapColor * (1 + material.blendFactor);
    blendFac = saturate(pow(abs(blendFac), material.blendFalloff));
  }

  // -- MICRO_DETAIL QUALITY (OBM/POM) --
  var cDiffuseMap = vec4f(0.0, 0.0, 0.0, 1.0);
  var cBumpMap = vec3f(0.0, 0.0, 1.0);
  switch (nMicroDetailQuality) {
    // TODO:
    // case MICRO_DETAIL_QUALITY_OBM: {
    //   uv = ApplyOBM(uv, viewTS);
    //   const float3 viewDir = mul(pPass.mTangentToWS, pPass.vView);
    //   #if %BLENDLAYER
    //       const float4 newCoords = OffsetMap(microDetailBaseTC, pPass.IN.blendLayerTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
    //       pPass.IN.blendLayerTC = newCoords.zw;
    //   #else
    //       const float4 newCoords = OffsetMap(microDetailBaseTC, viewDir, 2, dispAmount, pPass.fHeightBias, pPass.blendFac);
    //   #endif
    //   pPass.IN.baseTC.xy = newCoords.xy;
    //   pPass.IN.bumpTC.xy = newCoords.xy;
    // }
    // case MICRO_DETAIL_QUALITY_POM: {
    //     uv = ApplyPOM(uv, viewTS);
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

  // -- Detail Mapping --
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

    // if (bDetailBumpMappingMasking) {
    //   cDetailMap *= cDiffuseMap.a;
    // }

    cBumpMap += vec3f(cDetailMap.xy, 0.0);
  }

  cDiffuseMap *= material.diffuseColor;

  var vertCol  = input.vertColor;
  var alpha    = cDiffuseMap.a; // * pPass.IN.Ambient.w;
  var albedo   = cDiffuseMap.rgb;
  var normal   = normalize(tbn * normalize(cBumpMap));
  var specular = vec3f(1.0);
  // smoothness is the attached alpha of the normal map, served as a single channel texture (_ddna.dds.a)
  var gloss    = material.specularColor.a * textureSample(smoothnessMap, samplerLinear, uvBase.xy).r;
  // pPass.fNdotE   = (dot(pPass.vView.xyz, pPass.vNormal.xyz));
  // pPass.vReflVec = (2.0 * pPass.fNdotE * pPass.vNormal.xyz) - pPass.vView.xyz;
  var cFilterColor    = vec3f(1.0);

  // -- frag_custom_begin
  vertCol = vec4f(1.0); // Vegetation has custom color ouput - override vtx color back to default

  var opacity = 1.0;
  if (LEAVES || GRASS) {
    // orient normal of vegetation planes towards viewer to reduce fresnel gain and mimic some forward scattering
    // (clusterforward_commonzpass.cfi)
    normal = normalize(normal + normalize(input.toEye) * material.normalViewDependency);
    if (LEAVES) {
      opacity = textureSample(opacityMap, samplerLinear, uvBase.xy).r;
      cShadingBack = cBackLight.rgb * opacity;
    } else {
      cShadingBack = cBackLight.rgb;
    }
  }

  if (!GRASS) {
    specular = textureSample(specularMap, samplerLinear, uvBase.xy).rgb;
  }
  albedo   *= material.diffuseColor.rgb;
  specular *= material.specularColor.rgb;

  // -- Blend layer ------------------------------------------
  if (BLENDLAYER) {
    // not used
    // var diffuseMap2   = textureSample(diffuseMap2,    samplerLinear, uvBlendLayer.xy);
    // var specularMap2  = textureSample(specularMap2,   samplerLinear, uvBlendLayer.xy);
    // var glossLayer2   = textureSample(smoothnessMap2, samplerLinear, uvBlendLayer).a;

    // // Diffuse blend layer calculation
    // diffuseMap2      *= vec4f(material.blendLayer2Diffuse.rgb, 1.0);
    // albedo            = mix(albedo, diffuseMap2.rgb, blendFac);

    // // Specular blend layer calculation
    // specularMap2     *= vec4f(material.blendLayer2Specular.rgb, 1.0);
    // specular          = mix(specular, specularMap2.rgb, blendFac);

    // // Gloss blend layer calculation
    // glossLayer2      *= (material.blendLayer2Smoothness / 256.0);
    // gloss             = mix(gloss, glossLayer2, blendFac);
  }
  // #endregion
  // --

  // -- Detail mapping
  if (DETAIL_MAPPING) {
    albedo += albedo * cDetailMap.z;
    gloss  += gloss  * cDetailMap.w;
  }

  // the normal variance filter of the game (FilterGBufferPS) runs on the GBuffer, see FilterGBufferPass
  let authoredGloss = gloss;

  // -- Alpha test (%_RT_ALPHATEST) --------------------------
  if (material.enabledAlphaTest != 0u && alpha < material.alphaTestRef) {
    discard;
  }

  var s: VegetationSurface;
  s.toEye               = toEye;
  s.normal              = normal;
  s.albedo              = albedo;
  s.alpha               = alpha;
  s.specular            = specular;
  s.gloss               = gloss;
  s.authoredGloss       = authoredGloss;
  s.shadingBack         = cShadingBack;
  s.frontLight          = cFrontLight;
  s.opacity             = opacity;
  s.uvBase              = uvBase;
  s.uvEmittance         = uvEmittance;
  s.uvEmissiveIntensity = uvEmissiveIntensity;
  return s;
}

// Emitted light of a surface, zero without emittance. The deferred pipeline has no emissive variant for vegetation
// yet, only the debug view shows it.
fn vegetationEmittance(s: VegetationSurface) -> vec3f {
  var emittance = vec3f(0.0);
  let emissiveLum = getLuminance(material.emissiveColor.xyz);
  if (emissiveLum > 0.0) {
    var emitMapCol = vec4f(1.0);
    var emitMapInt = vec4f(0.5);
    if (EMITTANCE_MAP) {
      emitMapCol     = textureSample(emittanceMap,     samplerLinear, s.uvEmittance);
      if (!BLENDLAYER) {
        emitMapInt = textureSample(decalEmissiveMap, samplerLinear, s.uvEmissiveIntensity);
      }
    }
    emittance = emitMapCol.rgb;
    emittance *= pow(max(getLuminance(emitMapCol.rgb), 1e-6), material.emittanceMapGamma - 1.0);
    emittance *= emitMapInt.rgb;
    emittance *= (material.emissiveColor.xyz * material.emissiveColor.a * 0.1);
  }
  return emittance;
}

struct DebugOutput {
  @location(0) color: vec4f,
};

// Material debug view (global.debug), drawn over the lit image (NwRenderVariant.Debug). Modes without a material
// view draw nothing, the lighting pass shows the shading modes.
@fragment
fn fs_debug(input: FragmentInput) -> DebugOutput {
  let s = vegetationSurface(input);
  let roughness = smoothnessToRoughness(s.gloss);
  var color = vec4f(-1.0);
  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      color = vec4f(s.albedo, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      color = vec4f(s.specular, 1.0);
    }
    case DEBUG_MTL_METALLIC: {
      color = vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_ROUGHNESS: {
      color = vec4f(vec3f(roughness), 1.0);
    }
    case DEBUG_SH_SPECULAR_AA: {
      let authored = smoothnessToRoughness(s.authoredGloss);
      color = vec4f((roughness - authored) * 4.0, authored * 0.25, 0.0, 1.0);
    }
    case DEBUG_MTL_IOR: {
      color = vec4f(vec3f(0.0), 1.0);
    }
    case DEBUG_MTL_EMISSIVE: {
      color = vec4f(vegetationEmittance(s), 1.0);
    }
    case DEBUG_MTL_AO: {
      color = vec4f(vec3f(input.vertColor.a), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      color = vec4f(vec3f(s.opacity), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {
      color = vec4f(vec3f(material.emissiveColor.rgb), 1.0);
    }
    // #endregion

    // #region Debug Geometry / Vectors
    case DEBUG_GV_NORMAL: {
      color = vec4f(input.worldNormal.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_TANGENT: {
      color = vec4f(input.worldTangent.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_BITANGENT: {
      color = vec4f(input.worldBitangent.xyz * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_SHADE_NORMAL: {
      color = vec4f(s.normal * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_POSITION_WS: {
      color = vec4f(fract(input.worldPos.xyz), 1.0);
    }
    case DEBUG_GV_DEPTH: {
      color = vec4f(vec3f(fract(linearizeDepthReversedZ(input.position.z, view.near, view.far))), 1.0);
    }
    // #endregion

    // #region Vertex attributes
    case DEBUG_V_COLOR0: {
      color = vec4f(input.vertColor.xyz, 1.0);
    }
    case DEBUG_V_UV0: {
      color = vec4f(fract(s.uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      color = vec4f(fract(s.uvBase.zw), 0.0, 1.0);
    }
    case DEBUG_V_DEFORM: {
      if (material.deformWave1.w > 0) {
        color = vec4f(1.0, 0.0, 1.0, 1.0);
      }
    }
    // #endregion
    default: {}
  }
  if (color.a < 0.0) {
    discard;
  }
  var out: DebugOutput;
  out.color = color;
  return out;
}

// GBuffer attributes (vegetation.cfx ZPass, clusterforward_commonzpass.cfi): leaves and grass use the transmittance
// lighting model with transmittance = saturate(BackDiffuseMultiplier x opacity (leaves)) x TransmittanceColor.
// The forward only terms (grass front light, render quality scale) are not part of the gbuffer.
@fragment
fn fs_gbuffer(input: FragmentInput) -> GBufferOutput {
  let s = vegetationSurface(input);
  var g: GBufferSurface;
  g.normal        = s.normal;
  g.albedo        = s.albedo;
  g.reflectance   = s.specular;
  g.smoothness    = s.gloss;
  g.occlusion     = 1.0;
  g.lightingModel = LIGHTINGMODEL_STANDARD;
  g.transmittance = vec3f(0.0);
  if (LEAVES || GRASS) {
    g.lightingModel = LIGHTINGMODEL_TRANSMITTANCE;
    g.transmittance = saturate(material.backDiffuseMultiplier * s.opacity) * material.transmittanceColor.rgb;
  }
  return encodeGBuffer(g, linearizeDepthReversedZ(input.position.z, view.near, view.far));
}

// Blinn-Phong specular with smoothness remapped from [0,1] to a reasonable exponent.
fn blinnPhong(N: vec3f, L: vec3f, V: vec3f, smoothness: f32) -> f32 {
    let H = normalize(L + V);
    let exponent = exp2(smoothness * 10.0 + 1.0);   // 0→2, 1→2048
    return pow(max(0.0, dot(N, H)), exponent);
}


// Luminance (BT.601 coefficients, matching GetLuminance in CryEngine).
fn luminance(c: vec3f) -> f32 {
    return dot(c, vec3f(0.212671, 0.715160, 0.072169));
}
`
