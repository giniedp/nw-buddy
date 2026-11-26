import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `
struct MaterialBlock {
  diffuseColor          : vec4f,
  emissiveColor         : vec4f,

  animAmplitudeWav0         : f32, // default 0.0
  animAmplitudeWav2         : f32, // default 0.0
  animFrequency             : f32, // default 0.0
  animPhase                 : f32, // default 1.0

  bendDetailBranchAmplitude : f32, // default -
  bendDetailFrequency       : f32, // default 1.0
  bendDetailLeafAmplitude   : f32, // default 0.2

  complexColTile            : f32, // default 1.0
  depthFixupThreshold       : f32, // default 0.05
  fadeOutEnd                : f32, // default 0.75
  fadeOutStart              : f32, // default 0.1

  fresnelExponent           : f32, // default 1.0
  fresnelInFalloff          : f32, // default 1.0
  fresnelInSdfInf           : f32, // default 0.0
  fresnelInStrength         : f32, // default 1.0
  fresnelInvert             : f32, // default 1.0
  fresnelOutFalloff         : f32, // default 1.0
  fresnelOutSdfInf          : f32, // default 0.0
  fresnelOutStrength        : f32, // default 1.0
  fresnelSdfInfluence       : f32, // default 0.0
  fresnelSdfMapExp          : f32, // default 1.0
  fresnelSdfMapMix          : f32, // default 0.0
  fresnelStrength           : f32, // default 1.0

  globalAlphaFalloff        : f32, // default 1.0
  globalAlphaFill           : f32, // default 1.0
  globalAlphaFromSource     : f32, // default 0.0
  globalAlphaStrength       : f32, // default 1.0
  globalColorFalloff        : f32, // default 1.0

  intersectFadeDist         : f32, // default 2.0
  intersectFadeFalloff      : f32, // default 1.0
  intersectFadeInv          : f32, // default 0.0
  intersectGlowDist         : f32, // default 2.0
  intersectGlowFalloff      : f32, // default 1.0
  intersectGlowInv          : f32, // default 0.0

  paletteFalloff            : f32, // default 1.0
  palettePhase              : f32, // default 0.0
  paletteSdfInf             : f32, // default 0.0
  paletteSourceBlend        : f32, // default 0.0
  paletteSpeed              : f32, // default 1.0

  procGradFreq              : f32, // default 1.0
  procGradInv               : f32, // default 0.0
  procGradPosX              : f32, // default 0.0
  procGradPosY              : f32, // default 0.0
  procGradPosZ              : f32, // default 0.0
  procGradType              : f32, // default 0.0

  sdf2dPhaseX               : f32, // default 0.0
  sdf2dPhaseY               : f32, // default 0.0
  sdf2dSpeedX               : f32, // default 0.0
  sdf2dSpeedY               : f32, // default 0.0
  sdf2dStrength             : f32, // default 0.1
  sdf2dTileX                : f32, // default 1.0
  sdf2dTileY                : f32, // default 1.0

  sinewaveAmp               : f32, // default 0.1
  sinewaveAxis              : f32, // default 0
  sinewaveFreq              : f32, // default 1.0
  sinewaveNormal            : f32, // default 0
  sinewavePhase             : f32, // default 0.1
  sinewaveSpeed             : f32, // default 0.1

  source2dPhaseX            : f32, // default 0.0
  source2dPhaseY            : f32, // default 0.0
  source2dSpeedX            : f32, // default 0.0
  source2dSpeedY            : f32, // default 0.0
  source2dTileX             : f32, // default 1.0
  source2dTileY             : f32, // default 1.0


  // --- Feature flags - 0=disabled, 1=enabled -------------
  // USE_SDF_2D
  // VERTCOLORS
  // USE_PALETTE_MAP
  // USE_INTERSECTION_FADE
  // USE_OUTSIDE_FRESNEL_ALPHA
  // USE_GLOW_FRESNEL
  // USE_PROC_GRADS
  // USE_COMPLEX_COL
  // USE_INSIDE_FRESNEL_ALPHA
  // USE_COMPLEX_COL_OVERLAY
  // USE_INTERSECTION_GLOW
  // VERT_DEFORM_SINWAVE
  // USE_COMPLEX_COL_DODGE
  // ENABLE_FADEOUT

  // --- Texture modifier matrices
  uvModDiffuse                   : mat4x4f,
  enabledUvModDiffuse            : u32, // _ModifyUV_1

  deformWave0                    : vec4f,
  deformWave1                    : vec4f,
};

// ----------------------------------------------------------------------------
// Bindings
// ----------------------------------------------------------------------------

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;
// -@private
// -@group(0) @binding(3) var<uniform>    lights  : LightBlock;
@group(1) @binding(0) var<storage, read> object  : array<ObjectBlock>; // per instance data
@group(1) @binding(1) var<storage, read> instanceData : array<InstanceDataBlock>;
@group(2) @binding(0) var<uniform>       material: MaterialBlock;

@group(2) @binding(1) var samplerLinear      : sampler;
@group(2) @binding(2) var samplerPoint       : sampler;
// sampler of the source map, clamps for rotating texture modifiers
@group(2) @binding(3) var samplerSource      : sampler;

// @block view
// @unfilterable
@group(1) @binding(4) var sceneDepthMap : texture_2d<f32>;

// --- Texture bindings
@group(3) @binding(0) var diffuseMap         : texture_2d<f32>; // $Diffuse      (diffuseMap, diffuseMap_Decal)
@group(3) @binding(1) var normalMap          : texture_2d<f32>; // $Normal       (normalMap)
@group(3) @binding(2) var specularMap        : texture_2d<f32>; // $Specular     (specularMap)
// @group(3) @binding(3) var envMap          : texture_2d<f32>; // $Env          (envMap)
@group(3) @binding(4) var detailMap          : texture_2d<f32>; // $Detail       (detailMap) .ag=detail normal, .r=diffuse/gloss tint
@group(3) @binding(5) var translucencyMap    : texture_2d<f32>; // $SecondSmoothness, $Translucency (translucencyMap)
@group(3) @binding(6) var heightMap          : texture_2d<f32>; // $Heightmap    (heightMap) Height for offset bump, POM, silhouette POM, and displacement mapping defined by a Grayscale texture
@group(3) @binding(7) var decalEmissiveMap   : texture_2d<f32>; // $DecalOverlay (decalMap, emissiveIntensity) emittance multiplier or decal
// @group(3) @binding(8) var subsurfaceMap   : texture_2d<f32>; // $Subsurface   (subsurfaceMap, HeightMap2)
@group(3) @binding(9) var diffuseMap2        : texture_2d<f32>; // $Custom       (DiffuseMap2, MaskTex)
@group(3) @binding(10)var normalMap2         : texture_2d<f32>; // $CustomSecondaryMap  (BumpMap2)
@group(3) @binding(11)var opacityMap         : texture_2d<f32>; // $Opacity      (opacityMap, BlendMap, DecalOpacityMap)
@group(3) @binding(12)var smoothnessMap      : texture_2d<f32>; // $Smoothness   (smoothnessMap)
@group(3) @binding(13)var emittanceMap       : texture_2d<f32>; // $Emittance    (emittanceMap)
@group(3) @binding(14)var occlusionMap       : texture_2d<f32>; // $Occlusion    (OcclusionMap)
// @group(3) @binding(15) var specularMap2   : texture_2d<f32>; // $Specular2    (SpecularMap2)


struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) texture  : vec2f,
  @location(4) color    : vec4f,
  // skinned meshes (.skin bone mapping), a zero default for static meshes
  @location(5) joints   : vec4<u32>,
  @location(6) weights  : vec4f,
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0)       normal   : vec3f,
  @location(1)       uvBase   : vec4f, //
  @location(3)       uvScreen : vec4f,
  @location(4)       color    : vec4f,
  @location(5)       toEye    : vec3f,
  @location(6)       procGrad : vec4f,
  @location(7)       worldPos : vec3f,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let skinned = skinVertex(
    instanceData[input.id].skinOffset, input.joints, input.weights, input.position, input.normal, vec3f(0.0),
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
    vmod.typ      = u32(material.deformWave1.w);
    vPos = vertexModify(vmod);
  }

  if (VERT_DEFORM_SINWAVE) {
    vPos = fxSinWave(
      skinned.position,
      material.sinewaveAmp,
      material.sinewaveFreq,
      material.sinewaveSpeed,
      material.sinewavePhase,
      material.sinewaveAxis,
      select(vec3f(0.0), skinned.normal, material.sinewaveNormal == 1.0)
    );
  }

  let modelMatrix = object[input.id].modelMatrix;
  let worldPos = modelMatrix * vec4f(vPos, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  var clipPos  = view.projectionMatrix * viewPos;
  let toEye    = normalize(view.cameraPosition - worldPos.xyz);
  let view     = -toEye;

  let normalMat = inverseScaleMatrix(mat3x3f(
    modelMatrix[0].xyz,
    modelMatrix[1].xyz,
    modelMatrix[2].xyz
  ));
  let normal = -normalize(normalMat * skinned.normal);

  // --- Procedural Gradients
  var procGrad = vec4f(0.0);
  let vertPositionLSOffset = vec3f(material.procGradPosX, material.procGradPosY, material.procGradPosZ) / 10.0;
  let vertPositionLS       = 1.0 - (input.position.xyz / material.procGradFreq);
  let radialSDFPositionLS  = length(input.position.xyz - vertPositionLSOffset) / material.procGradFreq;
  procGrad = mix(
    vec4f(vertPositionLS, radialSDFPositionLS),
    vec4f(1.0 - vertPositionLS, 1.0 - radialSDFPositionLS),
    material.procGradInv
  );

  // --- Volumetric Fog
  // #if %_RT_FOG
  //   #if !%_RT_VOLUMETRIC_FOG
  //       OUT.localFogColor = GetVolumetricFogColor( vertPassPos.WorldPos.xyz );
  //   #else
  //     OUT.localFogColor = GetVolumetricFogAnalyticalColorByWorldPos( vertPassPos.WorldPos.xyz );
  //   #endif
  // #endif

  // --- UV MOD
  var uvBase = vec4f(input.texture.xy, 0.0, 1.0);
  if (material.enabledUvModDiffuse == TRUE) {
    uvBase = material.uvModDiffuse * uvBase;
  }

  var output: FragmentInput;
  output.position = clipPos;
  output.uvBase   = uvBase;
  output.uvScreen = clipPosToSceenUv(clipPos);
  output.normal   = normal;
  output.toEye    = toEye;
  output.color    = input.color;
  output.procGrad = procGrad;
  output.worldPos = worldPos.xyz;
  return output;
}


@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let time = frame.elapsedTime;
  let toEye = normalize(input.toEye);
  let view = -toEye;

  // --- SDF 2D
  var sdf2d = 0.0;
  if (USE_SDF_2D) {
    var uvSdf = input.uvBase.xy;
    uvSdf    *= vec2f(material.sdf2dTileX, material.sdf2dTileY);
    uvSdf    += vec2f(
      material.sdf2dSpeedX * time + material.sdf2dPhaseX,
      material.sdf2dSpeedY * time + material.sdf2dPhaseY,
    );
    sdf2d = textureSample(heightMap, samplerLinear, uvSdf).r;
  }

  // --- Source 2D
  var uvSource = input.uvBase.xy;
  uvSource    *= vec2f(material.source2dTileX, material.source2dTileY);
  uvSource    += vec2f(
    material.source2dSpeedX * time + material.source2dPhaseX,
    material.source2dSpeedY * time + material.source2dPhaseY,
  );
  let sdfStrength = select(0.0, material.sdf2dStrength, USE_SDF_2D);
  let sourceMap = textureSample(diffuseMap2, samplerSource, uvSource + vec2f(sdf2d * sdfStrength));

  var data = vec4f(
    sourceMap.rgb,
    mix(1.0, sourceMap.a, material.globalAlphaFromSource),
  );

  // --- Intersection Fade
  var interFade = 1.0;
  if (USE_INTERSECTION_FADE) {
    let sceneDepth   = sampleSceneDepth(input.uvScreen, sceneDepthMap);
    let beamDepth    = input.uvScreen.w; // clip.w = view-space Z from VS
    let depth        = sceneDepth - beamDepth;

    // CalculateDepthFade
    interFade = saturate(depth / material.intersectFadeDist);
    interFade = mix(interFade, 1.0 - saturate(interFade), material.intersectFadeInv);
    interFade = pow(interFade, material.intersectFadeFalloff);
  }

  // --- Palette map
  var paletteMap = 1.0;
  if (USE_PALETTE_MAP) {
    var uvPalette = vec2f(input.uvBase.y);

    if (VERTCOLORS) {
      uvPalette = vec2f(input.color.r);
    }

    if (USE_PROC_GRADS) {
      let t = material.procGradType;
      if(t >= 0 && t < 0.5) {
        uvPalette = vec2f(input.procGrad.x);
      }
      if(t >= 0.5 && t < 1.5) {
        uvPalette = vec2f(input.procGrad.y);
      }
      if(t >= 1.5 && t < 2.5) {
        uvPalette = vec2f(input.procGrad.z);
      }
      if(t >= 2.5 && t < 3.5) {
        uvPalette = vec2f(input.procGrad.w);
      }
      if(t >= 3.5 ) {
        if (USE_INTERSECTION_FADE) {
          uvPalette = vec2f(interFade * 0.75 + 0.125);
        }
      }
    }

    uvPalette = uvPalette * 0.75 + 0.125;
    uvPalette += time * material.paletteSpeed + material.palettePhase;

    var uvPaletteSDF = vec2f(0.0);
    if (USE_SDF_2D) {
      uvPaletteSDF = vec2f(mix(sdf2d, sourceMap.x, material.paletteSourceBlend)) * material.paletteSdfInf;
    }

    paletteMap = textureSample(detailMap, samplerLinear, uvPalette + uvPaletteSDF).r;
    paletteMap = pow(paletteMap, material.paletteFalloff);
  }

  data.w *= paletteMap;


  // --- Fresnel glow
  if (USE_GLOW_FRESNEL) {
    var glowSDF = 0.0;
    if (USE_SDF_2D) {
      glowSDF = (sdf2d - 0.5) * material.fresnelSdfInfluence;
    }

    var glowFresnel = fxFresnelApproxComplex(
      -input.toEye.xyz,
      input.normal.xyz,
      glowSDF,
      material.fresnelInvert,
      material.fresnelExponent,
      material.fresnelStrength
    );

    if (USE_SDF_2D) {
      glowFresnel = mix(glowFresnel, glowFresnel * pow(sdf2d, material.fresnelSdfMapExp), material.fresnelSdfMapMix);
    }
    data = vec4f(
      data.rgb + glowFresnel * material.emissiveColor.rgb,
      data.a
    );
  }

  // --- Fresnel alpha
  var fresnelAlphaO = 1.0;
  var fresnelAlphaI = 1.0;
  if (USE_OUTSIDE_FRESNEL_ALPHA) {
    let outFresnelSDF    = select(0.0, material.fresnelOutSdfInf, USE_SDF_2D);
    let fresnelAlphaSDFO = (sourceMap.x) * outFresnelSDF;
    fresnelAlphaO = fxFresnelApproxComplex(
      -input.toEye.xyz,
      input.normal.xyz,
      fresnelAlphaSDFO,
      0.0,
      material.fresnelOutFalloff,
      material.fresnelOutStrength
    );
  }
  if (USE_INSIDE_FRESNEL_ALPHA) {
    let inFresnelSDF = select(0.0, material.fresnelInSdfInf, USE_SDF_2D);
    let fresnelAlphaSDFI = (sourceMap.x) * inFresnelSDF;
    fresnelAlphaI = fxFresnelApproxComplex(
      -input.toEye.xyz,
      input.normal.xyz,
      fresnelAlphaSDFI,
      1.0,
      material.fresnelInFalloff,
      material.fresnelInStrength
    );
  }
  data.a *= saturate(fresnelAlphaO * fresnelAlphaI * 10.0);

  // --- Intersection glow
  var interFadeGlow = 0.0;
  if (USE_INTERSECTION_GLOW) {
    let sceneDepth   = sampleSceneDepth(input.uvScreen, sceneDepthMap);
    let beamDepth    = input.uvScreen.w; // clip.w = view-space Z from VS
    let depth        = sceneDepth - beamDepth;

    // CalculateDepthFade
    interFadeGlow = saturate(depth / material.intersectGlowDist);
    interFadeGlow = mix(interFadeGlow, 1.0 - saturate(interFadeGlow), material.intersectGlowInv);
    interFadeGlow = pow(interFadeGlow, material.intersectGlowFalloff);
  }

  data.a += interFadeGlow;
  data.a *= interFade;
  if (USE_PROC_GRADS) {
    if(material.procGradType >= 4 && material.procGradType < 5) {
      data.a *= 1.0 - interFade;
    }
  }

  // --- Blending Modes
  var complexColor = vec3f(0.0, 0.0, 0.0);
  if (USE_COMPLEX_COL) {

    let complexColorTC = input.uvBase.xy * material.complexColTile;
    complexColor = textureSample(specularMap, samplerLinear, complexColorTC).rgb;
    if (USE_COMPLEX_COL_DODGE && !USE_COMPLEX_COL_OVERLAY) {
      data = vec4f(
        fxBlendModeColorDodge(data, complexColor),
        data.a
      );
    }
    if (!USE_COMPLEX_COL_DODGE && USE_COMPLEX_COL_OVERLAY) {
      data = vec4f(
        fxBlendModeOverlay(data.xyz, complexColor),
        data.a
      );
    }

  } else {
    data = vec4f(
      data.rgb * material.emissiveColor.rgb,
      data.a
    );
  }

  data = vec4f(
    saturate(pow(data.xyz, vec3f(material.globalColorFalloff))) * material.emissiveColor.w,
    saturate(pow(data.w, material.globalAlphaFalloff) * material.globalAlphaFill) * material.globalAlphaStrength
  );

  if (VERTCOLORS) {
    data *= input.color.a;
  }

  // #if %ENABLE_FADEOUT
  //   float fadeDistInterpolation = saturate(IN.InstAlphaTest.z); // clamp the value between 0 and 1.
  //   float center = (FadeOutStart + FadeOutEnd) / 2.0; // adjust the normal distribution center based on the bell curve start and end position
  //   float stdDev = 0.2 * (FadeOutEnd - FadeOutStart); // calculate standard deviation for the bell curve.
  //   float fadeAmount = saturate((0.398942 / stdDev) * exp(-0.5 * pow(((fadeDistInterpolation - center) / stdDev), 2))); // normal distribution bell shaped curve
  //   OUT.Color*= fadeAmount;
  // #endif

  // fog (FxMeshAdvancedTranspPS: ApplyVolumetricFog), the material blends additively, so only the transmittance
  // applies like the additive particles
  if (global.skipFog == 0u) {
    data = vec4f(data.rgb * getSceneFog(input.worldPos).a, data.a);
  }

  var out: FragmentOutput;
  out.color = data;
  // out.color = vec4f(1.0, 0.0, 1.0, 1.0); // debug magenta

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

fn fxFresnelApproxComplex(
  v        : vec3f,
  n        : vec3f,
  sdf      : f32,
  invert   : f32,
  exponent : f32,
  power    : f32,
) -> f32 {
  let s     = step(1.0 - 1e-7, invert);
  let ndotv = dot(normalize(n), normalize(v));
  let a     = 1.0 - (1.0 - s) + sdf;
  let b     = ndotv * (1.0 - s) + ndotv * step(1.0, s) * -1.0;
  let c     = saturate(a + b);
  return pow(c, exponent) * power;
}

fn fxBlendModeColorDodge(color: vec4f, map: vec3f) -> vec3f {
    return (color.xyz * material.emissiveColor.xyz ) / (map * material.diffuseColor.xyz);
}

fn fxBlendModeOverlay(cData: vec3f, map: vec3f) -> vec3f {
  let blendFactor = 0.5;
  let c1 = cData * material.emissiveColor.xyz;
  let c2 = map * material.diffuseColor.xyz;

  let cond = step(c1, vec3f(0.5));
  return mix(
    2.0 * c2 * c1,
    1.0 - (1.0 - 2.0 * (c1 - 0.5)) * (1.0 - blendFactor),
    cond
  );
}
${COMMON_WGSL}
`
