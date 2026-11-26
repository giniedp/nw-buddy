import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct InstanceExtra {
  opacity: f32,
  pad0:    f32,
  pad1:    f32,
  pad2:    f32,
};

struct MaterialBlock {

  diffuseColor           : vec4f, // default (1,1,1,1)
  dissolveColor          : vec4f, // default (1,1,1,1)

  ambStrength            : f32, // default 1.0
  brightness             : f32, // default 1.0
  fadingFeaturing        : f32, // default 0.55
  viewDependencyFactor   : f32, // default 2.0
  softIntersectionFactor : f32, // default 1.0
  fadeOutDistance        : f32, // default 0.2
  sunColorInfluence      : f32, // default 0.5
  refrBumpScale          : f32, // default 0.1
  refractionBlend        : f32, // default 0.0
  dissolveEdgeThickness  : f32, // default 0.0
  dissolvePercentage     : f32, // default 0.0



  // -- Feature flags - 0=disabled, 1=enabled -------------
  enabledDiffuseMap2       : u32,
  enabledDiffuseMap3       : u32,
  enabledDiffuseMap4       : u32,
  enabledRefraction        : u32,
  enabledApplySunColor     : u32,
  enabledFadeout           : u32,
  // enabledFxDissolve: u32,

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
};

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
// -@private
// -@group(0) @binding(3) var<uniform>    lights  : LightBlock;

@group(1) @binding(0) var<storage, read> object  : array<ObjectBlock>;
@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear  : sampler;
@group(2) @binding(2) var samplerPoint   : sampler;

// @block view
// @unfilterable
@group(1) @binding(8) var sceneDepthMap: texture_2d<f32>;
// @block view
@group(1) @binding(9) var sceneColorMap:  texture_2d<f32>;

// -- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
// @group(3) @binding(2) var specularMap     : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
// @group(3) @binding(5) var translucencyMap : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
// @group(3) @binding(6) var heightMap       : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
// @group(3) @binding(8) var subsurfaceMap   : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
// @group(3) @binding(10)var normalMap2      : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
// @group(3) @binding(11) var opacityMap     : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
// @group(3) @binding(12) var smoothnessMap  : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13) var emittanceMap      : texture_2d<f32>; // $Emittance    (emittanceMap)
// @group(3) @binding(14) var occlusionMap   : texture_2d<f32>; // $Occlusion    (OcclusionMap)
// @group(3) @binding(15) var specularMap2   : texture_2d<f32>; // $Specular2    (SpecularMap2)

// --- mapping the maps
fn sampleDiffuseMap1(uv: vec2f) -> vec4f {
  return textureSample(diffuseMap, samplerLinear, uv);
}
fn sampleDiffuseMap2(uv: vec2f) -> vec4f {
  return textureSample(diffuseMap2, samplerLinear, uv);
}
fn sampleDiffuseMap3(uv: vec2f) -> vec4f {
  return textureSample(decalEmissiveMap, samplerLinear, uv);
}
fn sampleDiffuseMap4(uv: vec2f) -> vec4f {
  return textureSample(detailMap, samplerLinear, uv);
}
fn sampleMaskMap(uv: vec2f) -> vec4f {
  return textureSample(emittanceMap, samplerLinear, uv);
}
fn sampleNormalMap(uv: vec2f) -> vec4f {
  return textureSample(normalMap, samplerLinear, uv);
}

struct VertexInput {
  @builtin(instance_index) id:       u32,
  @location(0) position: vec3f,
  @location(1) normal:   vec3f,
  @location(2) texture:  vec4f,
  @location(3) color:    vec4f,
};

struct FragmentInput {
  @builtin(position) position   : vec4f,
  @location(0)       worldPos   : vec3f,
  @location(1)       uvBase     : vec4f,
  @location(2)       uvDif12    : vec4f,
  @location(3)       uvDif34    : vec4f,
  @location(4)       uvMask     : vec4f,
  @location(5)       uvScreen   : vec4f,
  @location(6)       color      : vec4f,
  @location(7)       camDist01  : f32,
  @interpolate(flat)
  @location(8)       instanceId:   u32,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let modelMatrix = object[input.id].modelMatrix;

  let worldPos = modelMatrix * vec4f(input.position, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  let toEye    = normalize(view.cameraPosition - worldPos.xyz);
  let view     = -toEye;

  // --- Directionfading
  let instInvScaleMat = inverseScaleMatrix(mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  ));
  let normalWS = normalize(instInvScaleMat * input.normal);

  var d = dot(toEye, normalWS);
      d = d * d;
      d = saturate(d * material.viewDependencyFactor);
      d = d * d;

  // --- Base color
  var color = input.color * material.diffuseColor * d;
      color = vec4f(color.rgb * material.brightness, color.a);

  // --- Sun color
  if (material.enabledApplySunColor == TRUE) {
    let sunColor = mix(vec3f(1.0), global.sunColor.rgb, material.sunColorInfluence);
    color = vec4f(color.rgb * sunColor, color.a);
  }

  // --- UV Transforms
  var uvBase = vec4f(input.texture.xy, 0.0, 1.0);
  let uvDif1 = (material.uvModDiffuse * uvBase).xy;
  let uvDif2 = (material.uvModCustom  * uvBase).xy;
  let uvDif3 = (material.uvModDecalEmissive * uvBase).xy;
  let uvDif4 = (material.uvModDetail * uvBase).xy;
  let uvMask = (material.uvModEmittance * uvBase);

  // --- Camera distance for fadeout
  // let camDist   = distance(view.cameraPosition, worldPos4.xyz);
  // let camDist01 = saturate(camDist / max(1e-4, material.fadeOutDistance * 1000.0));

  var output: FragmentInput;
  output.position   = clipPos;
  output.worldPos   = worldPos.xyz;
  output.uvBase     = uvBase;
  output.uvMask     = uvMask;
  output.uvDif12    = vec4f(uvDif1, uvDif2);
  output.uvDif34    = vec4f(uvDif3, uvDif4);
  output.uvScreen   = clipPosToSceenUv(output.position);
  output.color      = color;
  // output.camDist01  = camDist01;
  output.instanceId = input.id;
  return output;
}


// ----------------------------------------------------------------------------
// Fragment stage
// ----------------------------------------------------------------------------
@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {

  let diffuse1 = sampleDiffuseMap1(input.uvDif12.xy);
  var mask     = sampleMaskMap(input.uvMask.xy);

  var diffuse2 = vec4f(1.0);
  var diffuse3 = vec4f(1.0);
  var diffuse4 = vec4f(1.0);

  if (material.enabledDiffuseMap2 == TRUE) {
    diffuse2 = sampleDiffuseMap2(input.uvDif12.zw);
  } else {
    mask.g = 0.0;
  }

  if (material.enabledDiffuseMap3 == TRUE) {
    diffuse3 = sampleDiffuseMap3(input.uvDif34.xy);
  } else {
    mask.b = 0.0;
  }

  if (material.enabledDiffuseMap4 == TRUE) {
    diffuse4 = sampleDiffuseMap4(input.uvDif34.zw);
  } else {
    mask.a = 0.0;
  }

  // Weighted blend across the 4 diffuse layers.
  var outColor =
      diffuse1 * mask.r * diffuse1.a
    + diffuse2 * mask.g * diffuse2.a
    + diffuse3 * mask.b * diffuse3.a
    + diffuse4 * mask.a * diffuse4.a;

  outColor = outColor * input.color;

  // --- Refraction
  if (material.enabledRefraction == TRUE) {
    let normal = decodeNormal(sampleNormalMap(input.uvDif12.xy).xy);
    let uvOff  = normal * material.refrBumpScale;
    let uvRef  = input.uvScreen.xy / input.uvScreen.w + uvOff.xy;
    let refrCol = textureSample(sceneColorMap, samplerLinear, uvRef).rgb;
    outColor = vec4f(
      mix(outColor.rgb, refrCol, mask.r * material.refractionBlend),
      outColor.a,
    );
  }

  // --- Fading
  var fading = material.fadingFeaturing;
  // if (material.enabledFadeout != 0u) {
  //   fading *= (1.0 - input.camDist01);
  // }
  outColor.a *= (1.0 - gaussianRemap(input.color.a, fading));

  // --- Soft scene intersection
  let sceneDepth    = sampleSceneDepth(input.uvScreen, sceneDepthMap);
  let beamDepth     = input.uvScreen.w; // clip.w = view-space Z from VS
  let depth         = sceneDepth - beamDepth;

  let softIntersect = clamp(material.softIntersectionFactor * min(depth, beamDepth), 0.0, 1.0);
  let nearClamp     = clamp(material.softIntersectionFactor * (beamDepth - view.near), 0.0, 1.0);
  let fadeBeam      = min(softIntersect, nearClamp);

  // --- FX_DISSOLVE TODO:
  // #if %FX_DISSOLVE
  //   // Clip and color the edges around the clipped area
  //   ClipDissolvedFrags(float3(0,0,0),IN.tcDif1_Dif2.xy, OUT.Color.rgb);
  // #endif

  // --- Ambience
  outColor = vec4f(outColor.rgb * material.ambStrength, outColor.a);

  // fog (MeshParticlePS: ApplyVolumetricFog over the straight alpha color)
  if (global.skipFog == 0u) {
    let fog = getSceneFog(input.worldPos);
    outColor = vec4f(outColor.rgb * fog.a + fog.rgb, outColor.a);
  }

  // ---- Final alpha shaping ------------------------------------------
  outColor.a *= fadeBeam;
  //outColor.a *= instanceExtra[input.instanceId].opacity;

  var out: FragmentOutput;
  out.color = outColor;

  return out;
}

fn gaussianRemap(f: f32, featuringParam: f32) -> f32 {
  return exp2(-(featuringParam * f * f));
}

fn inverseScaleMatrix(worldMat: mat3x3<f32>) -> mat3x3<f32> {
  let trWrlMat = transpose(worldMat);

  let scaleVec = vec3<f32>(
    1.0 / dot(trWrlMat[0], trWrlMat[0]),
    1.0 / dot(trWrlMat[1], trWrlMat[1]),
    1.0 / dot(trWrlMat[2], trWrlMat[2])
  );

  let row0 = trWrlMat[0] * scaleVec.x;
  let row1 = trWrlMat[1] * scaleVec.y;
  let row2 = trWrlMat[2] * scaleVec.z;

  return transpose(mat3x3<f32>(row0, row1, row2));
}
${COMMON_WGSL}
`
