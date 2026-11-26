import { COMMON_WGSL } from './common.wgsl'

export default /*wgsl */ `

struct MaterialBlock {
  diffuseColor                   : vec4f,

  // --- Gradient
  startColor                     : vec4f, // default 1.0, 1.0, 1.0, 1.0
  endColor                       : vec4f, // default 1.0, 1.0, 1.0, 1.0

  // --- Tweakables
  finalMultiplier                : f32, // default 1.0
  softIntersectionFactor         : f32, // default 1.0
  viewDependencyFactor           : f32, // default 2.0
  fadingFeaturing                : f32, // default 0.55
  ambStrength                    : f32, // default 0.12
  baseUVScale                    : f32, // default 1.0

  // --- Dust / noise
  dustUVScale                    : f32, // default 0.6
  dustTimeScale                  : f32, // default 1.0
  turbStrength                   : f32, // default 1.0
  turbRatio                      : f32, // default 0.55
  uvRot                          : f32, // default 0.0
  backgroundAlphaNoiseSpeedX     : f32, // default 0.1
  backgroundAlphaNoiseSpeedY     : f32, // default 0.05
  backgroundAlphaNoiseSpeedZ     : f32, // default 0.15

  uvVigFeaturing                 : f32, // default 4.0
  volumetricScale                : f32, // default 0.7

  sunColorInfluence              : f32, // default 0.5
  fogColorInfluence              : f32, // default 0.0
  fadeOutDistande                : f32, // default 0.2

  // -- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1

  deformWave0                    : vec4f,
  deformWave1                    : vec4f,
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
@group(1) @binding(1) var<storage, read> instanceData : array<InstanceDataBlock>; // per instance data
@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear  : sampler;
@group(2) @binding(2) var samplerPoint   : sampler;

// @block view
// @unfilterable
@group(1) @binding(8) var sceneDepthMap: texture_2d<f32>;
// -- Texture bindings
@group(3) @binding(0) var diffuseMap     : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap      : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap    : texture_2d<f32>; // $Specular     (specularMap)
@group(3) @binding(3) var smoothnessMap  : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(4) var noise3DTex     : texture_3d<f32>;


struct VertexInput {
  @builtin(instance_index) id       : u32,
  @location(0)             position : vec3f,
  @location(1)             normal   : vec3f,
  @location(2)             texture  : vec2f,
  @location(3)             color    : vec4f,
};

struct FragmentInput {
  @builtin(position) position  : vec4f,
  @location(0)       worldPos  : vec3f,
  @location(1)       uvBase    : vec4f,
  @location(2)       uvNoise   : vec3f,
  @location(3)       uvScreen  : vec4f,
  @location(4)       color     : vec4f,
  // instance distance relative to its max view distance (GetInstance_RelativeDistance)
  @location(5) @interpolate(flat) relDistance : f32,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {

  let modelMatrix = object[input.id].modelMatrix;

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

  let vertPos  = vec4f(vPos, 1.0);
  let worldPos = modelMatrix * vertPos;
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  let toEye    = normalize(view.cameraPosition - worldPos.xyz);
  let view     = -toEye;


  // -- UV ROTATION --
  var uvBaseMod = vec4f(input.texture.xy, 0.0, 1.0);
  if (NOISE) {
    let uvRotRad = material.uvRot * 2.0 * PI;
    let cosRot   = cos(uvRotRad);
    let sinRot   = sin(uvRotRad);
    uvBaseMod.x = input.texture.x * cosRot - input.texture.y * sinRot;
    uvBaseMod.y = input.texture.y * cosRot + input.texture.x * sinRot;
  }

  // -- UV MOD DIFFUSE --
  if (material.enabledUvModDiffuse == TRUE) {
    uvBaseMod = material.uvModDiffuse * uvBaseMod;
  }

  // ---- Directionfading
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

  // ---- Color / Gradient
  var color = input.color.rgba * material.diffuseColor.rgba * material.finalMultiplier * d;
  let colorGradient = select(
    saturate(input.texture.x),     // horizontal gradient
    saturate(input.texture.y),     // vertical gradient
    VERTICAL_GRADIENT
  );

  color = vec4f(
    color.rgb * mix(material.startColor.rgb, material.endColor.rgb, colorGradient),
    color.a,
  );
  if (GRADIENT_ALPHA) {
    color.a *= (1.0 - colorGradient);
  }

  // --- 3D noise lookup coords
  var uvNoise = vec3f(0.0);
  if (NOISE) {
    let t = frame.elapsedTime;
    uvNoise.x = dot(vertPos, vec4f(0.05, 0.0, 0.0, t * material.backgroundAlphaNoiseSpeedX));
    uvNoise.y = dot(vertPos, vec4f(0.0, 0.05, 0.0, t * material.backgroundAlphaNoiseSpeedY));
    uvNoise.z = dot(vertPos, vec4f(0.0, 0.0, 0.10, t * material.backgroundAlphaNoiseSpeedZ));
  }

  var output: FragmentInput;
  output.position = clipPos;
  output.worldPos = worldPos.xyz;
  output.uvBase   = uvBaseMod;
  output.uvNoise  = uvNoise;
  output.uvScreen = clipPosToSceenUv(clipPos);
  output.color    = color;
  output.relDistance = 0.0;
  if (ENABLE_FADEOUT) {
    output.relDistance = instanceRelativeDistance(instanceData[input.id], modelMatrix);
  }

  return output;
}


// ----------------------------------------------------------------------------
// Fragment stage
// ----------------------------------------------------------------------------


@fragment
fn fragment_main(input: FragmentInput) -> FragmentOutput {

  var uvBaseScaled  = input.uvBase.xy * material.baseUVScale;
  var uvDustScaled  = input.uvBase.xy * material.dustUVScale;
  var uvNoiseScaled = input.uvNoise   * material.dustTimeScale;

  var diffuseSample = textureSample(diffuseMap, samplerLinear, uvBaseScaled);
  var color         = vec4f(diffuseSample.rgb, min(diffuseSample.r, diffuseSample.a));

  var fNoise       = 1.0;
  var dust         = vec3f(1.0);
  var dustFinal    = vec3f(1.0);
  var dustFinalAvg = 1.0;
  if (NOISE) {
    fNoise    = textureSample(noise3DTex,  samplerLinear, input.uvNoise).r * 2.0 - 0.25;
    dust      = textureSample(specularMap, samplerLinear, uvDustScaled + uvNoiseScaled.xy).rgb;

    let uvTurb = (vec2f(fNoise * 0.17, fNoise) * 0.5 + 0.5) * material.turbStrength;
    let dust2  = textureSample(normalMap,   samplerLinear, uvTurb).rgb;
    let dust2Detail = 0.5 * (dust2.r * dust2.g + dust2.b);
    dustFinal    = mix(dust, dust2 * dust2Detail, material.turbRatio);
    dustFinalAvg = dot(dustFinal.rgb, vec3f(1.0 / 3.0));
  }

  // ---- Shadowing
  var shadowOccl = 1.0;
  // #region Shadow
  // TODO:
  // #endregion

  // ---- UV Vignetting
  if (UV_VIGNETTING) {
    let linearVig = length(fract(uvBaseScaled) * 2.0 - 1.0);
    color.a *= gaussianRemap(linearVig, material.uvVigFeaturing);
  }

  // ---- Fadeout
  var fadeOut = material.fadingFeaturing;
  if (ENABLE_FADEOUT) {
    // CalculateVisibilityFade
    fadeOut *= saturate((1.0 - input.relDistance) / material.fadeOutDistande);
  }
  // fadeOut *= CalculateLodSmoothFade(IN.DissolveRef.xy); LOD crossfade, the viewer does not load LODs

  color.a *= 1.0 - gaussianRemap(input.color.a, fadeOut);


  // ---- Soft scene intersection
  let sceneDepth   = sampleSceneDepth(input.uvScreen, sceneDepthMap);
  let beamDepth    = input.uvScreen.w; // clip.w = view-space Z from VS
  // fade out at the ocean surface as well
  let depth        = min(sceneDepth - beamDepth, input.worldPos.z - global.oceanLevel);

  let softIntersect = saturate(material.softIntersectionFactor * min(depth, beamDepth));
  let nearClamp     = saturate(material.softIntersectionFactor * (beamDepth - view.near));
  let fadeBeam      = min(softIntersect, nearClamp );

  // ---- Sun / Fog coloring
  var effectColor = input.color.rgb;
  if (APPLY_SUN_COLOR) {
    effectColor *= mix(vec3f(1.0), global.sunColor.xyz, material.sunColorInfluence);
  }
  if (APPLY_FOG_COLOR) {
    // blend in the hue of the fog scattering color (normalized by its luminance)
    let scattering = global.fogScatteringColor.rgb;
    effectColor *= mix(vec3f(1.0), scattering / max(0.0001, luminance(scattering)), material.fogColorInfluence);
  }

  color = vec4f(
    color.rgb * effectColor * dustFinal * fadeBeam * (shadowOccl + material.ambStrength) * fNoise,
    color.a,
  );

  // ApplyFog: additive blending only attenuates by the fog transmittance, the scene behind carries the in-scattering
  if (global.skipFog == 0u) {
    color = vec4f(color.rgb * getVolumetricFogDensity(input.worldPos), color.a);
  }

  var out: FragmentOutput;
  out.color = color;
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(diffuseSample.xyz, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      //
    }
    case DEBUG_MTL_METALLIC: {
      //
    }
    case DEBUG_MTL_ROUGHNESS: {
      //
    }
    case DEBUG_MTL_IOR: {
      //
    }
    case DEBUG_MTL_EMISSIVE: {
      //
    }
    case DEBUG_MTL_AO: {
      out.color = vec4f(vec3f(shadowOccl), 1.0);
    }
    case DEBUG_MTL_OPACITY: {
      out.color = vec4f(vec3f(out.color.a), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {

    }
    case DEBUG_MTL_NOISE: {
      out.color = vec4f(vec3f(fNoise), 1.0);
    }
    // #endregion

    // #region Debug Geometry / Vectors
    case DEBUG_GV_NORMAL: {

    }

    case DEBUG_GV_TANGENT: {

    }
    case DEBUG_GV_BITANGENT: {

    }

    case DEBUG_GV_POSITION_WS: {

    }
    case DEBUG_GV_DEPTH: {

    }

    // #endregion

    // #region Debug Vertex Attributes
    case DEBUG_V_COLOR0: {
      out.color = vec4f(input.color.rgb, 1.0);
    }
    case DEBUG_V_COLOR1: {
      out.color = vec4f(effectColor.xyz, 1.0);
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(uvBaseScaled.xy) , 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      out.color = vec4f(fract(input.uvNoise.xyz), 1.0);
    }
    case DEBUG_V_DEFORM: {
      if (material.deformWave1.w > 0) {
        out.color = vec4f(1.0, 0.0, 1.0, 1.0);
      }
    }
    // #endregion
    default: {
      //
    }
  }

  return out;
}

fn gaussianRemap(f: f32, featuringParam: f32) -> f32 {
  return exp2(-(featuringParam * f * f));
}

fn luminance(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
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
