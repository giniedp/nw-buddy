import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct MaterialBlock {
  animAmplitude          : f32, // default 0.3
  animOffset             : f32, // default 0.0
  animSpeed              : f32, // default 0.5
  bumpAnimSpeed          : f32, // default 0.3
  bumpScale              : f32, // default 0.005
  bumpTilling            : f32, // default 0.4
  diffuseColor           : vec4f,
  diffuseRange           : f32, // default 1.0
  softIntersectionFactor : f32, // default 1.0

  // -- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  enabledUvModDiffuse            : u32,     // _ModifyUV_1
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
@group(2) @binding(1) var samplerLinear  : sampler;
@group(2) @binding(2) var samplerPoint   : sampler;

// @block view
// @unfilterable
@group(1) @binding(8) var sceneDepthMap: texture_2d<f32>;
// --- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)


struct VertexInput {
  @builtin(instance_index) id       : u32,
  @location(0)             position : vec3f,
  @location(1)             normal   : vec3f,
  @location(2)             texture  : vec2f,
};

struct FragmentInput {
  @builtin(position) position      : vec4f,
  @location(0)       uvBase        : vec4f,
  @location(1)       uvBump        : vec4f,
  @location(2)       uvScreen      : vec4f,
  @location(3)       worldPos      : vec3f,
};


@vertex
fn vs_main(input: VertexInput) -> FragmentInput {

  let modelMatrix = object[input.id].modelMatrix;

  let vertPos  = vec4f(input.position, 1.0);
  let worldPos = modelMatrix * vertPos;
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  // let toEye    = normalize(view.cameraPosition - worldPos.xyz);


  // Blend 2 frames at diferent phases (similar to flowmaps)
  // float4    PerView_AnimGenParams; // time * {2.0, 0.5, 1.0, 0.125}
  // float2 vAnimGen = PerView_AnimGenParams.xx * AnimSpeed * float2(1, -BumpAnimSpeed);
  let vAnimGen = vec2f(frame.elapsedTime * 2.0) * material.animSpeed * vec2f(1, -material.bumpAnimSpeed);
  let vAnimAmpl = material.animAmplitude * saturate(1.0 + material.animOffset - input.texture.y); // scale amplitude via V coordinate
  let vAnimFreq = fract(vec2f(vAnimGen.x) - vec2f(0.0, 0.5));
  let vAnim = (vAnimFreq * vec2f(vAnimAmpl) - vec2f(material.animOffset)).xxyy * vec4f(0.0, 1.0, 0.0, 1.0);


  let uvBase = input.texture.xyxy + vAnim.xyzw;
  var uvBump = vec4f(
    (input.texture.x - 0.5) * material.bumpTilling + 0.5 + 0.0,
    (input.texture.y - 0.5) * material.bumpTilling + 0.5 + vAnimGen.y,
    saturate( abs(0.5 - vAnimFreq.x) * 2.0),
    0.0
  );


  var output: FragmentInput;
  output.position = clipPos;
  output.uvBase   = uvBase;
  output.uvBump   = uvBump;
  output.uvScreen = clipPosToSceenUv(clipPos);
  output.worldPos = worldPos.xyz;

  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {

  var vNormal = vec2f(0.0);
  if (NORMAL_MAP) {
    let bumpUV = input.uvBump.xyxy * material.uvModDiffuse;
    vNormal = textureSample(normalMap, samplerLinear, bumpUV.xy).xy * material.bumpScale;
  }

  // UV2 is stored in baseTC.zw and calculated from the original UV in the vertex shader
  var uv1 = (input.uvBase.xy + vNormal.xy).xyxy;
  var uv2 = (input.uvBase.zw + vNormal.xy).xyxy;

  // Adjust texture coordinates using the modificator matrix
  uv1 = uv1 * material.uvModDiffuse;
  uv2 = uv2 * material.uvModDiffuse;

  let cDiffuseMap1 = textureSample(diffuseMap, samplerLinear, uv1.xy);
  let cDiffuseMap2 = textureSample(diffuseMap, samplerLinear, uv2.xy);
  let cDiffuseMap  = saturate(mix(cDiffuseMap1, cDiffuseMap2, input.uvBump.z));

  var alpha = cDiffuseMap.a * material.diffuseColor.a;
  var albedo = cDiffuseMap.rgb * material.diffuseColor.rgb * material.diffuseRange * material.diffuseRange;

  // fog (ParticleImposterPS: ApplyVolumetricFog over the straight alpha color)
  if (global.skipFog == 0u) {
    let fog = getSceneFog(input.worldPos);
    albedo = albedo * fog.a + fog.rgb;
  }

  if (SOFT_PARTICLE) {
    let sceneDepth   = sampleSceneDepth(input.uvScreen, sceneDepthMap);
    let softIntersect = saturate( material.softIntersectionFactor * (sceneDepth - input.uvScreen.w) );
    alpha *= softIntersect;
  }

  var out: FragmentOutput;
  out.color = vec4f(albedo, alpha);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);


  switch (global.debug) {
    // #region Debug Material
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(cDiffuseMap.xyz, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {

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

    }
    case DEBUG_MTL_OPACITY: {
      out.color = vec4f(vec3f(out.color.a), 1.0);
    }
    case DEBUG_MTL_HEIGHT: {

    }
    case DEBUG_MTL_NOISE: {

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
      out.color = vec4f(cDiffuseMap1.rgb, 1.0);
    }
    case DEBUG_V_COLOR1: {
      out.color = vec4f(cDiffuseMap2.xyz, 1.0);
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(uv1.xy) , 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
       out.color = vec4f(fract(uv2.xy), 0.0, 1.0);
    }
    // #endregion
    default: {
      //
    }
  }

  return out;
}

${COMMON_WGSL}
`
