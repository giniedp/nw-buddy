import { COMMON_WGSL } from './common.wgsl'

export default /*wgsl */ `

// =============================================================
// Bind Group 2 - Per-material
// =============================================================
struct MaterialBlock {
  // -- Base tint (c0) ---------------------------------------------------------
  diffuseColor           : vec4f,   // PerMaterial_DiffuseColor - tints vertex / computed color

  // -- Gradient colors (c29, c30) ---------------------------------------------
  startColor             : vec4f,   // default {1,1,1,1}
  endColor               : vec4f,   // default {1,1,1,0}

  // -- c28 (PER_MATERIAL_1) - always active -----------------------------------
  finalMultiplier        : f32,    // default 1.0  - overall brightness
  softIntersectionFactor : f32,    // default 1.0  - soft edge against opaque geometry
  viewDependencyFactor   : f32,    // default 2.0  - view-angle attenuation strength

  // -- c31 (PER_MATERIAL_4) - fog-plane mode ---------------------------------
  fadingFeaturing        : f32,    // default 0.55 - gaussian curve of vertex-alpha fading
  dustUVScale            : f32,    // default 0.6  - %NOISE: dust specular UV scale
  dustTimeScale          : f32,    // default 1.0  - %NOISE: dust animation speed multiplier
  turbStrength           : f32,    // default 1.0  - %NOISE: turbulence tiling multiplier

  // -- c32 (PER_MATERIAL_5) ---------------------------------------------------
  turbRatio              : f32,    // default 0.55 - %NOISE: dust/turbulence lerp weight
  uvRot                  : f32,    // default 0.0  - %NOISE: base UV rotation (0–1 = 0–360°)
  volumetricScale        : f32,    // default 0.7  - %RECEIVE_SHADOWS: shadow volume radius (unused)
  uvVigFeaturing         : f32,    // default 4.0  - %UV_VIGNETTING: gaussian edge falloff steepness

  // -- c33 (PER_MATERIAL_6) - fog-plane mode ---------------------------------
  ambStrength            : f32,    // default 0.12 - ambient fill added to shadow/light term
  baseUVScale            : f32,    // default 1.0  - diffuse texture tiling scale

  // -- c34 (PER_MATERIAL_7) - fog-plane camera-distance fade -----------------
  nearFadeStart          : f32,    // default   0.0 m - near-fade begins here
  nearFadeSize           : f32,    // default   2.0 m - distance over which near fade ramps in
  farFadeStart           : f32,    // default 100.0 m - far-fade begins here
  farFadeSize            : f32,    // default  50.0 m - distance over which far fade ramps out

  // -- c35–c36 (PER_MATERIAL_8–9) - beam-proc geometry (%USE_AS_BEAMPROC) ----
  beamLength             : f32,    // default 10.0 - rendered beam length along X
  origLength             : f32,    // default 10.0 - mesh original length (X axis)
  origWidth              : f32,    // default  1.0 - mesh original YZ half-width
  startRadius            : f32,    // default  1.0 - cone radius at fLerp=0
  endRadius              : f32,    // default  2.0 - cone radius at fLerp=1

  // -- UV matrix -------------------------------------------------------------
  // Matches _TCMMatrixDiffuse1 / _ModifyUV_1.  Applied as: (vec4(uv, 0, 1) * m).xy
  uvTransform1           : mat4x4f,

  // -- Feature flags (0 = disabled, 1 = enabled) -----------------------------
  enabledNoise           : u32,   // %NOISE
  enabledUvVignetting    : u32,   // %UV_VIGNETTING
  enabledUseAsBeamProc   : u32,   // %USE_AS_BEAMPROC
  enabledUvTransform1    : u32,

  // -- GeometryFogNoVertAlpha (geometryfognovertalpha.cfx) --------------------
  enabledNoVertAlpha     : u32,   // shader variant without vertex color/alpha
  enabledApplySunColor   : u32,   // %APPLY_SUN_COLOR
  sunColorInfluence      : f32,   // default 0.9 - amount of sun color applied
}

// ----------------------------------------------------------------------------
// Bindings
// ----------------------------------------------------------------------------
// @private
@group(0) @binding(0) var<uniform>       global   : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view     : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame    : FrameBlock;

@group(1) @binding(0) var<storage, read> object   : array<ObjectBlock>;
@group(2) @binding(0) var<uniform>       material : MaterialBlock;

// @block material
@group(3) @binding(0) var textureSampler: sampler;
// @block material
// t0 $Diffuse (sRGB)
@group(3) @binding(1) var diffuseMap    : texture_2d<f32>;
// @block material
// t1 $Normal - %NOISE fog-plane
@group(3) @binding(2) var normalMap     : texture_2d<f32>;
// @block material
// t2 $Specular (sRGB) - %NOISE fog-plane
@group(3) @binding(3) var specularMap   : texture_2d<f32>;
// @block material
// EngineAssets/Textures/Noise3D.dds
@group(3) @binding(4) var noiseMap3D    : texture_3d<f32>;
// TS_ZTarget - linear view-space depth
// @block view
// @unfilterable
@group(3) @binding(5) var sceneDepthMap: texture_2d<f32>;


// =============================================================
// Vertex I/O
// =============================================================
struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position : vec3f,   // object-space position
  @location(1) color    : vec4f,   // COLOR0 - per-vertex alpha/color (fog-plane mode)
  // @alias texture
  @location(2) texcoord : vec2f,   // base texture UV (uvBase)
  @location(3) tangent  : vec4f,   // .xyz = tangent, .w = handedness sign
  @location(4) normal   : vec3f,   // object-space normal (= normalize(T×B)*T.w)
}

struct VertexOutput {
  @builtin(position) Position       : vec4f,
  @location(0)       color          : vec4f,   // fully-computed interpolated color from VS
  @location(1)       uvBase         : vec4f,   // UV-matrix-transformed texture coords (.xy used)
  @location(2)       uvNoise        : vec4f,   // object-space animated 3D noise coords (.xyz used)
  @location(3)       screenUv       : vec4f,   // used in PS for depth read
  @location(4)       cameraDistance : f32,     // world-space distance to camera (fog-plane only; 0 in beam)
}

// =============================================================
// BeamVS
// =============================================================
@vertex
fn vertex_main(input: VertexInput) -> VertexOutput {
  let model     = object[input.id].modelMatrix;
  var localPos  = input.position.xyz;
  let worldPos4 = model * vec4f(localPos, 1.0);

  var uv     = input.texcoord;
  var fLerp  = 1.0;

  // -- Beam-proc vertex deformation (%USE_AS_BEAMPROC) ----------------------
  // Remaps mesh along X axis and tapers YZ to produce a cone/cylinder shape.
  // Matches the deformation block in BeamVS inside the #if %USE_AS_BEAMPROC guard.
  if (material.enabledUseAsBeamProc != 0u) {
    fLerp        = localPos.x / material.origLength;
    let radius   = mix(material.startRadius, material.endRadius, fLerp) / material.origWidth;
    localPos     = vec3f(
      fLerp * material.beamLength,
      localPos.y * radius,
      localPos.z * radius
    );
  } else if (material.enabledNoise != 0u) {
    // Fog-plane: rotate UV when %NOISE is active (uvRot ∈ [0,1] = 0–360°)
    let angle = material.uvRot * 2.0 * PI;
    let c = cos(angle);
    let s = sin(angle);
    uv = vec2f(
      uv.x * c - uv.y * s,
      uv.y * c + uv.x * s
    );
  }

  // -- View-dependency attenuation -------------------------------------------
  // normalWS: object normal transformed with inverse-scale matrix so that
  // non-uniform scale does not distort the facing angle.
  let wm3       = mat3x3f(model[0].xyz, model[1].xyz, model[2].xyz);
  let invSM     = inverseScaleMat3(wm3);
  let normalWS  = normalize(invSM * input.normal);
  let viewWS    = normalize(view.cameraPosition.xyz - worldPos4.xyz);

  // d = (dot(V,N))² then re-squared - smoother roll-off at glancing angles.
  var d = dot(viewWS, normalWS);
  d = d * d;
  d = clamp(d * material.viewDependencyFactor, 0.0, 1.0);
  d = d * d;

  var output: VertexOutput;
  if (material.enabledUvTransform1 != 0u) {
    let uvMod = (vec4f(uv, 0.0, 1.0) * material.uvTransform1   ).xy;
    output.uvBase = vec4f(uvMod, uv);
  } else {
    output.uvBase = vec4f(uv, uv);
  }

  // -- Color computation -----------------------------------------------------
  if (material.enabledUseAsBeamProc != 0u) {
      // Beam-proc: gamma-square colors before gradient blend (sRGB approximation).
      let sc = material.startColor.xyz   * material.startColor.xyz;
      let ec = material.endColor.xyz     * material.endColor.xyz;
      let dc = material.diffuseColor.xyz * material.diffuseColor.xyz;
      let gradRGB = mix(ec, sc, clamp(1.0 - fLerp, 0.0, 1.0));

      output.color = material.finalMultiplier * vec4f(gradRGB * dc, 1.0) * d;
      output.cameraDistance = 0.0;

  } else if (material.enabledNoVertAlpha != 0u) {
      // GeometryFogNoVertAlpha: no vertex color, DiffuseColor is applied in the PS
      let tcX = clamp(input.texcoord.x, 0.0, 1.0);
      var rgb = material.finalMultiplier * d * mix(material.startColor.rgb, material.endColor.rgb, tcX);
      if (material.enabledApplySunColor != 0u) {
        // takes the sun luminance into account to ensure no over glow at night / too little during day
        rgb *= mix(vec3f(1.0), global.sunColor.xyz, material.sunColorInfluence);
      }
      output.color = vec4f(rgb, material.finalMultiplier * d * (1.0 - tcX));
      output.cameraDistance = length(worldPos4.xyz - view.cameraPosition.xyz);

  } else {
      // Fog-plane: vertex color tinted by DiffuseColor; gradient along UV.x
      let tcX      = clamp(input.texcoord.x, 0.0, 1.0);  // un-rotated tc for gradient
      let vtxColor = input.color * material.diffuseColor;

      let rgb = material.finalMultiplier * vtxColor.rgb * d
              * mix(material.startColor.rgb, material.endColor.rgb, tcX);
      let a   = material.finalMultiplier * vtxColor.a * d * (1.0 - tcX);

      output.color = vec4f(rgb, a);
      output.cameraDistance = length(worldPos4.xyz - view.cameraPosition.xyz);
  }

  // -- Noise texture coordinates ---------------------------------------------
  // Generated from object-space position dotted with animated generator vectors.
  // XYZ axes get different spatial frequencies and time offsets (see cfx VS).
  // Both beam-proc and fog-plane use the same formula; beam-proc uses post-deform position.
  if (material.enabledNoise != 0u) {
    let t    = frame.elapsedTime;
    let pos4 = vec4f(localPos, 1.0);
    output.uvNoise = vec4f(
        dot(pos4, vec4f(0.05,  0.0,  0.0,  t * 0.10)),
        dot(pos4, vec4f(0.0,   0.05, 0.0,  t * 0.15)),
        dot(pos4, vec4f(0.0,   0.0,  0.10, t * 0.05)),
        0.0,
    );
  } else {
    output.uvNoise = vec4f(0.0);
  }

  // -- Screen projection for depth-buffer soft intersection ------------------
  output.Position = view.projectionMatrix * view.viewMatrix * worldPos4;
  output.screenUv = clipPosToSceenUv(output.Position);

  return output;
}

@fragment
fn fragment_main(input: VertexOutput) -> FragmentOutput {
  var out: FragmentOutput;


  var color = input.color;

  // -- Diffuse texture -------------------------------------------------------
  var baseTex: vec4f;
  if (material.enabledUseAsBeamProc != 0u) {
      baseTex = textureSample(diffuseMap, textureSampler, input.uvBase.xy);
  } else {
      baseTex = textureSample(diffuseMap, textureSampler, input.uvBase.xy * material.baseUVScale);
  }

  // -- Soft intersection -----------------------------------------------------
  // sceneDepth and beamDepth are both in linear view-space units.
  // depth > 0 means opaque geometry is behind the beam fragment.
  // fadeBeam goes from 0 (intersecting geometry or near-plane) to 1 (clear space).
  let sceneDepth   = sampleSceneDepth(input.screenUv, sceneDepthMap);
  let beamDepth    = input.screenUv.w; // clip.w = view-space Z from VS
  let depth        = sceneDepth - beamDepth;

  let nearPlane = view.near;
  let softIntersect = clamp(material.softIntersectionFactor * min(depth, beamDepth), 0.0, 1.0);
  let nearClamp     = clamp(material.softIntersectionFactor * (beamDepth - nearPlane), 0.0, 1.0);
  let fadeBeam      = min(softIntersect, nearClamp);

  // -- Noise / dust (both modes share this block) ----------------------------
  var fNoise    = 1.0;
  var dustFinal = vec3f(1.0);

  if (material.enabledNoise != 0u) {
    if (material.enabledUseAsBeamProc != 0u) {
      // Beam-proc: noise scalar only - drives fNoise multiplicatively.
      let noiseSample = textureSample(noiseMap3D, textureSampler, input.uvNoise.xyz);
      fNoise = clamp(noiseSample.a * 2.0 - 0.25, 0.0, 1.0);
    } else {
      // Fog-plane: 3D noise → specular dust → normal turbulence.
      // noiseUVOffset applies dustTimeScale to the UV offset channel;
      // noiseMap3D itself is sampled at the raw (un-scaled) noise coords.
      let noiseUVOffset = input.uvNoise.xyz * material.dustTimeScale;
      fNoise = clamp(
          textureSample(noiseMap3D, textureSampler, input.uvNoise.xyz).a * 2.0 - 0.25,
          0.0, 1.0);

      let dust  = textureSample(specularMap, textureSampler,
                      input.uvBase.xy * material.dustUVScale + noiseUVOffset.xy).rgb;

      // Turbulence from normalMap: UV driven by noise value to create
      // a dependent-read swirl.  turbStrength tiles the lookup.
      let dust2UV     = (vec2f(fNoise * 0.17, fNoise) * 0.5 + 0.5)
                        * material.turbStrength;
      let dust2       = textureSample(normalMap, textureSampler, dust2UV).rgb;
      let dust2Detail = 0.5 * (dust2.r * dust2.g + dust2.b);

      dustFinal = mix(dust, dust2 * dust2Detail, material.turbRatio);
    }
  }

  // -- GeometryFogNoVertAlpha output (BeamPS in geometryfognovertalpha.cfx) ---
  if (material.enabledNoVertAlpha != 0u) {
    var alphaOut = baseTex.a;
    if (material.enabledUvVignetting != 0u) {
      let linearVig = length(fract(input.uvBase.xy * material.baseUVScale) * 2.0 - 1.0);
      alphaOut     *= gaussianRemap(linearVig, material.uvVigFeaturing);
    }
    let nearFade = clamp((input.cameraDistance - material.nearFadeStart) / max(material.nearFadeSize, 1e-6), 0.0, 1.0);
    let farFade  = clamp(1.0 - (input.cameraDistance - material.farFadeStart) / max(material.farFadeSize, 1e-6), 0.0, 1.0);
    alphaOut    *= nearFade * nearFade * farFade * farFade;

    // %RECEIVE_SHADOWS not supported, shadow occlusion is 1
    let shadowOccl = 1.0;
    let rgbOut = baseTex.rgb
               * input.color.rgb
               * dustFinal
               * fadeBeam
               * (shadowOccl + material.ambStrength)
               * fNoise
               * material.diffuseColor.rgb;
    out.color = vec4f(rgbOut, alphaOut);
    return out;
  }

  // -- Beam-proc output ------------------------------------------------------
  if (material.enabledUseAsBeamProc != 0u) {
    // Alpha overridden to 1; the in-VS color already encodes view-dependency
    // and the gradient.  Multiply by noise and soft intersection.
    color = baseTex * vec4f(input.color.rgb, 1.0) * fadeBeam * fNoise;
  } else {
    // -- Fog-plane alpha -------------------------------------------------------
    // baseTex.a is multiplied by up to three independent factors before near/far fade.

    var alphaOut = baseTex.a;

    // %UV_VIGNETTING: gaussian falloff at UV-space edges
    if (material.enabledUvVignetting != 0u) {
        let vigUV     = fract(input.uvBase.xy * material.baseUVScale) * 2.0 - 1.0;
        let linearVig = length(vigUV);
        alphaOut     *= gaussianRemap(linearVig, material.uvVigFeaturing);
    }

    // Vertex-alpha fading curve: input.color.w encodes (FinalMultiplier * vtxAlpha * d * (1−tc.x))
    // gaussianRemap(0, k)=1 → opaque at UV edge 0; rolls off to transparent at UV edge 1.
    alphaOut *= 1.0 - gaussianRemap(input.color.w, material.fadingFeaturing);

    // Near/far camera-distance fade, squared for a softer transition (matches cfx: factor²*factor²)
    let nearFade  = clamp((input.cameraDistance - material.nearFadeStart)
                          / max(material.nearFadeSize, 1e-6), 0.0, 1.0);
    let farFade   = clamp(1.0 - (input.cameraDistance - material.farFadeStart)
                          / max(material.farFadeSize, 1e-6), 0.0, 1.0);
    alphaOut     *= nearFade * nearFade * farFade * farFade;

    // -- Fog-plane RGB ---------------------------------------------------------
    // %RECEIVE_SHADOWS excluded: shadowOccl is fixed at 1.0, so the term becomes
    // (1.0 + ambStrength) which brightens by ambStrength above a fully-lit value.
    // With real shadows the range would be [ambStrength … 1+ambStrength].
    let shadowOccl = 1.0;
    let rgbOut = baseTex.rgb
                * input.color.rgb
                * dustFinal
                * fadeBeam
                * (shadowOccl + material.ambStrength)
                * fNoise;

    color = vec4f(rgbOut, alphaOut);
  }

  out.color = color;
  // out.color = vec4f(1.0, 0.0, 1.0, 1.0); // debug: output white


  // switch (global.debug) {
  //   // #region Debug Material
  //   case DEBUG_MTL_ALBEDO: {

  //   }
  //   case DEBUG_MTL_SPECULAR: {

  //   }
  //   case DEBUG_MTL_METALLIC: {

  //   }
  //   case DEBUG_MTL_ROUGHNESS: {

  //   }
  //   case DEBUG_MTL_IOR: {

  //   }
  //   case DEBUG_MTL_EMISSIVE: {

  //   }
  //   case DEBUG_MTL_AO: {

  //   }
  //   case DEBUG_MTL_OPACITY: {
  //      out.color = vec4<f32>(baseTex.a, 0.0, 0.0, 1.0);
  //   }
  //   case DEBUG_MTL_HEIGHT: {
  //      out.color = vec4<f32>(beamDepth, 0.0, 0.0, 1.0);
  //   }
  //   // #endregion

  //   // #region Debug Geometry / Vectors
  //   case DEBUG_GV_NORMAL: {

  //   }
  //   case DEBUG_GV_GEOMETRIC_NORMAL: {

  //   }
  //   case DEBUG_GV_TANGENT: {

  //   }
  //   case DEBUG_GV_BITANGENT: {

  //   }
  //   case DEBUG_GV_FACE_NORMAL: {

  //   }
  //   case DEBUG_GV_POSITION_WS: {

  //   }
  //   case DEBUG_GV_DEPTH: {

  //   }
  //   case DEBUG_GV_VIEW_DIR: {

  //   }
  //   // #endregion

  //   // #region Debug Vertex Attributes
  //   case DEBUG_V_COLOR0: {
  //     out.color = vec4f(input.color.rgb, 1.0);
  //   }
  //   case DEBUG_V_COLOR1: {
  //     out.color = vec4f(baseTex.rgb, 1.0);
  //   }
  //   case DEBUG_V_UV0: {
  //     out.color = vec4<f32>(input.uvBase.xy, 0.0, 1.0);
  //   }
  //   case DEBUG_V_UV1: {
  //     out.color = vec4<f32>(input.uvBase.zw, 0.0, 1.0);
  //   }
  //   // #endregion
  // }

  return out;
}

fn gaussianRemap(f: f32, k: f32) -> f32 {
    return exp2(-k * f * f);
}

// Port of InverseScaleMatrixFast() from common.cfi.
// Returns a matrix that correctly transforms object-space normals into world space
// under non-uniform scaling (avoids shear artefacts that plain worldMat would produce).
fn inverseScaleMat3(m: mat3x3f) -> mat3x3f {
    let t  = transpose(m);
    let s  = 1.0 / vec3f(
      dot(t[0], t[0]),
      dot(t[1], t[1]),
      dot(t[2], t[2])
    );
    return transpose(mat3x3f(
      t[0] * s.x,
      t[1] * s.y,
      t[2] * s.z)
    );
}


${COMMON_WGSL}
`
