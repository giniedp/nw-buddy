import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'
import { PROBES_WGSL } from './probes.wgsl'

/**
 * HumanSkin shader (humanskin.cfx): character skin and fur.
 *
 * Opaque, deferred like the game: `fs_gbuffer` is the ZPass (GatherMaterialAttribs + SkinZPassPS), the lighting pass
 * shades it with the transmittance lighting model. `fs_emissive` is the additive glow pass of SkinPS.
 *
 * Not ported:
 * - the SSS index (attribs.ScatteringIndex) is not encoded, the GBuffer has no slot for it yet (plan 3.5 SSS blur)
 * - %WRINKLE_BLENDING (no data), %DETAIL_MAPPING / %BLENDLAYER / %DECAL_MAP (not in the skin data)
 * - tessellation, %TRANSPARENT_ZPREPASS (only a depth pre pass before the opaque draw)
 */
export default /* wgsl */ `
struct MaterialBlock {
  diffuseColor          : vec4f, // PerMaterial_DiffuseColor
  specularColor         : vec4f, // PerMaterial_SpecularColor .xyz=F0 .w=smoothness
  emissiveColor         : vec4f, // PerMaterial_EmissiveColor

  melanin               : f32,   // default 0.0
  sssIndex              : f32,   // default 1.2
  translucencyMultiplier: f32,   // default 0.0
  emittanceMapGamma     : f32,   // default 1.0

  // %HAS_DECAL_LAYERS (character customization)
  tattooColor           : vec4f, // default 1, 1, 1, 1
  scarColor             : vec4f, // default 1, 1, 1, 1
  facialMarkingColor    : vec4f, // default 1, 1, 1, 1
  scarNormalStrength    : f32,   // default 1.0
  scarTissue            : f32,   // default 1.0

  // %OVERLAY_MASK (CharacterMasking.cfi)
  maskR                 : f32,
  maskRColor            : vec3f,
  maskROverride         : f32,
  maskG                 : f32,
  maskGColor            : vec3f,
  maskGOverride         : f32,
  maskB                 : f32,
  maskBColor            : vec3f,
  maskBOverride         : f32,
  maskAGloss            : f32,
  maskAGlossShift       : f32,   // default 0.5
  maskASpecColor        : vec3f,
  maskASpecColorOverride: f32,

  // %FX_DISSOLVE
  dissolveColor         : vec4f, // default 1, 1, 1, 1
  dissolveEdgeThickness : f32,
  dissolvePercentage    : f32,

  // %RIM_DIFFUSE_LIGHTING / %RIM_SPEC_LIGHTING (RimLighting.cfi)
  rimMajorColor         : vec4f, // default 1, 1, 1, 1
  rimMajorIntensity     : f32,   // default 1
  rimMajorWidth         : f32,   // default 1
  rimFillColor          : vec4f, // default 1, 1, 1, 1
  rimFillIntensity      : f32,   // default 0.4
  rimFillWidth          : f32,   // default 1
  rimColorBlend         : f32,   // default 0.1
  rimSmoothness         : f32,   // default 1
  rimCenterColor        : vec4f, // default 1, 1, 1, 1
  rimCenterIntensity    : f32,   // default 0

  alphaTestRef          : f32,
  enabledAlphaTest      : u32,

  uvModDiffuse          : mat4x4f,
  enabledUvModDiffuse   : u32,   // _ModifyUV_1

  // xy = scale, bias of normalMap, zw = of scarNormalMap, by their texture formats (decodeNormalMap)
  normalMapEncoding     : vec4f,
};

@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear      : sampler;

@group(3) @binding(0)  var diffuseMap        : texture_2d<f32>; // $Diffuse, .a = SSS amount with %SUBSURFACE_SCATTERING_MASK
@group(3) @binding(1)  var normalMap         : texture_2d<f32>; // $Normal
@group(3) @binding(2)  var specularMap       : texture_2d<f32>; // $Specular
@group(3) @binding(3)  var smoothnessMap     : texture_2d<f32>; // $Smoothness
@group(3) @binding(4)  var opacityMap        : texture_2d<f32>; // $Opacity: .r translucency, .g dissolve noise
@group(3) @binding(5)  var emittanceMap      : texture_2d<f32>; // $Emittance
@group(3) @binding(6)  var emissiveIntensity : texture_2d<f32>; // $DecalOverlay, emittance multiplier
@group(3) @binding(7)  var maskMap           : texture_2d<f32>; // $CustomMap, overlay mask (MaskTex)
@group(3) @binding(8)  var tattooMap         : texture_2d<f32>; // $CustomMap3 ([2] Custom)
@group(3) @binding(9)  var freckleMap        : texture_2d<f32>; // $CustomMap4 ([3] Custom)
@group(3) @binding(10) var scarMap           : texture_2d<f32>; // $CustomMap5 ([4] Custom)
@group(3) @binding(11) var scarNormalMap     : texture_2d<f32>; // $CustomMap6 ([5] Custom)
@group(3) @binding(12) var scarGlossMap      : texture_2d<f32>; // $CustomMap6Smoothness ([5] Smoothness)
@group(3) @binding(13) var rimMap            : texture_2d<f32>; // $CustomSecondaryMap ([1] Custom), rim color .r

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

@group(1) @binding(0) var<storage, read> object       : array<ObjectBlock>;
@group(1) @binding(1) var<storage, read> instanceData : array<InstanceDataBlock>;

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
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) uvBase  : vec4f, // .xy = modified uv, .zw = original uv
  @location(2) @interpolate(perspective, centroid) worldTangent  : vec3f,
  @location(3) @interpolate(perspective, centroid) worldBitangent: vec3f,
  @location(4) @interpolate(perspective, centroid) worldNormal   : vec3f,
  @location(5) viewVec : vec3f,
  @location(6) dissolve: f32,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let modelMatrix = object[input.id].modelMatrix;
  let skinned = skinVertex(
    instanceData[input.id].skinOffset, input.joints, input.weights, input.position, input.normal, input.tangent.xyz,
  );
  let worldPos = modelMatrix * vec4f(skinned.position, 1.0);

  let normal    = normalize((modelMatrix * vec4f(skinned.normal, 0.0)).xyz);
  let tangent   = normalize((modelMatrix * vec4f(skinned.tangent, 0.0)).xyz);
  let bitangent = cross(normal, tangent) * input.tangent.w;

  var output: FragmentInput;
  output.position       = view.projectionMatrix * view.viewMatrix * worldPos;
  output.worldPos       = worldPos.xyz;
  output.worldNormal    = normal;
  output.worldTangent   = tangent;
  output.worldBitangent = bitangent;
  output.viewVec        = normalize(view.cameraPosition - worldPos.xyz);
  output.dissolve       = instanceData[input.id].dissolveAmount;

  let uv = vec4f(input.texture.xy, 0.0, 1.0);
  var uvMod = uv;
  if (material.enabledUvModDiffuse == TRUE) {
    uvMod = material.uvModDiffuse * uv;
  }
  output.uvBase = vec4f(uvMod.xy, uv.xy);
  return output;
}

// SkinSynthesis: darkens the diffuse map by its own luminance with the melanin amount
fn skinSynthesis(diffuse: vec3f, m: f32) -> vec3f {
  let lum = dot(diffuse, vec3f(0.33, 0.59, 0.11));
  return diffuse * mix(vec3f(1.0), diffuse * lum, m);
}

struct SkinSurface {
  normal       : vec3f,
  albedo       : vec3f,
  reflectance  : vec3f,
  smoothness   : f32,
  transmittance: vec3f,
};

// GatherMaterialAttribs + the ZPass additions (overlay mask, dissolve). May discard.
fn skinSurface(input: FragmentInput) -> SkinSurface {
  ditherFade(input.position.xy, distance(view.cameraPosition, input.worldPos), input.dissolve);

  let uv = input.uvBase.xy;
  let diffuse = textureSample(diffuseMap, samplerLinear, uv);
  if (material.enabledAlphaTest == TRUE && diffuse.a < material.alphaTestRef) {
    discard;
  }

  let tbn = mat3x3f(
    normalize(input.worldTangent),
    normalize(input.worldBitangent),
    normalize(input.worldNormal),
  );

  // --- normals
  var normalTS = vec3f(0.0, 0.0, 1.0);
  if (NORMAL_MAP) {
    normalTS = decodeNormalMap(textureSample(normalMap, samplerLinear, uv).xy, material.normalMapEncoding.xy);
  }

  var smoothness = material.specularColor.w;
  var albedo = diffuse.rgb;
  if (HAS_DECAL_LAYERS) {
    let scar = textureSample(scarMap, samplerLinear, uv);
    let scarNormal = decodeNormalMap(textureSample(scarNormalMap, samplerLinear, uv).xy, material.normalMapEncoding.zw);
    // how far the scar has healed
    let heal = smoothstep(0.0, 1.0, pow(scar.w, material.scarTissue));
    let gloss = textureSample(smoothnessMap, samplerLinear, uv).r;
    let glossScar = mix(gloss, textureSample(scarGlossMap, samplerLinear, uv).r, heal);
    smoothness *= glossScar;
    normalTS = vec3f(normalTS.xy + scarNormal.xy * material.scarNormalStrength, normalTS.z * scarNormal.z);

    let marking = textureSample(freckleMap, samplerLinear, uv);
    let tattoo = textureSample(tattooMap, samplerLinear, uv);
    albedo = mix(albedo, marking.rgb * material.facialMarkingColor.rgb, marking.w);
    albedo = mix(albedo, tattoo.rgb * material.tattooColor.rgb, smoothstep(0.0, 1.0, tattoo.w * tattoo.w));
    let freshScar = mix(albedo, scar.rgb * material.scarColor.rgb, heal);
    albedo = mix(freshScar, albedo, smoothstep(3.5, 4.0, material.scarTissue));
  } else {
    smoothness *= textureSample(smoothnessMap, samplerLinear, uv).r;
  }

  var normal = normalize(tbn[2]);
  if (NORMAL_MAP || HAS_DECAL_LAYERS) {
    normal = normalize(tbn * normalTS);
  }

  albedo *= material.diffuseColor.rgb;
  albedo = skinSynthesis(albedo, material.melanin);

  var reflectance = material.specularColor.rgb;
  if (SPECULAR_MAP) {
    reflectance *= textureSample(specularMap, samplerLinear, uv).rgb;
  }

  // translucency: thin areas pass light (opacity map .r)
  let translucency = textureSample(opacityMap, samplerLinear, uv).r * material.translucencyMultiplier;
  let transmittance = exp((1.0 - saturate(translucency)) * vec3f(-8.0, -40.0, -64.0));

  if (OVERLAY_MASK) {
    let mask = textureSample(maskMap, samplerLinear, uv);
    let masked = applyOverlayMask(OverlayMaskSurface(albedo, reflectance, smoothness), mask, skinOverlayMaskParams());
    albedo      = masked.albedo;
    reflectance = masked.specular;
    smoothness  = masked.gloss;
  }

  if (FX_DISSOLVE) {
    let noise = textureSample(opacityMap, samplerLinear, uv).g;
    albedo = clipDissolve(noise, material.dissolvePercentage, material.dissolveEdgeThickness, material.dissolveColor.rgb, albedo);
  }

  var s: SkinSurface;
  s.normal        = normal;
  s.albedo        = albedo;
  s.reflectance   = reflectance;
  s.smoothness    = smoothness;
  s.transmittance = transmittance;
  return s;
}

fn skinOverlayMaskParams() -> OverlayMaskParams {
  return OverlayMaskParams(
    material.maskR, material.maskRColor, material.maskROverride,
    material.maskG, material.maskGColor, material.maskGOverride,
    material.maskB, material.maskBColor, material.maskBOverride,
    material.maskAGloss, material.maskAGlossShift, material.maskASpecColor, material.maskASpecColorOverride,
  );
}

// GetEmittance of SkinPS, zero without an emissive color. uv is the original primary uv, without the diffuse modifier.
fn skinEmittance(uv: vec2f) -> vec3f {
  if (getLuminance(material.emissiveColor.xyz) <= 0.0) {
    return vec3f(0.0);
  }
  var color = vec4f(1.0);
  var intensity = vec4f(0.5);
  if (EMITTANCE_MAP) {
    color = textureSample(emittanceMap, samplerLinear, uv);
    intensity = textureSample(emissiveIntensity, samplerLinear, uv);
  }
  var e = color.rgb * pow(max(getLuminance(color.rgb), 1e-6), material.emittanceMapGamma - 1.0);
  e *= intensity.rgb;
  e *= color.a; // DEPRECATED in the game, kept for compatibility
  return e * material.emissiveColor.rgb * material.emissiveColor.a * EMITTANCE_TO_ENGINE_LIGHT_SCALE;
}

// %RIM_DIFFUSE_LIGHTING / %RIM_SPEC_LIGHTING, added to the emittance (SkinPS); the skin per light function is the default
// one without the wrap lighting of the secondary viewports
fn skinRimLighting(s: SkinSurface, input: FragmentInput) -> vec3f {
  if (!(RIM_DIFFUSE_LIGHTING || RIM_SPEC_LIGHTING)) {
    return vec3f(0.0);
  }
  let p = RimParams(
    material.rimMajorColor.rgb, material.rimMajorIntensity, material.rimMajorWidth,
    material.rimFillColor.rgb, material.rimFillIntensity, material.rimFillWidth,
    material.rimColorBlend, material.rimSmoothness,
    material.rimCenterColor.rgb, material.rimCenterIntensity,
  );
  if (!rimLightingActive(p)) {
    return vec3f(0.0);
  }
  let toEye = normalize(input.viewVec);
  let light = rimLight(s.normal, toEye, p, textureSample(rimMap, samplerLinear, input.uvBase.xy).r);
  return rimLightingDefault(s.normal, toEye, s.smoothness, s.reflectance, light, RIM_DIFFUSE_LIGHTING, RIM_SPEC_LIGHTING);
}

// ZPass (SkinZPassPS): transmittance lighting model, lit by the deferred lighting pass
@fragment
fn fs_gbuffer(input: FragmentInput) -> GBufferOutput {
  let s = skinSurface(input);
  var g: GBufferSurface;
  g.normal        = s.normal;
  g.albedo        = s.albedo;
  g.reflectance   = s.reflectance;
  g.smoothness    = s.smoothness;
  g.occlusion     = 1.0;
  g.lightingModel = LIGHTINGMODEL_TRANSMITTANCE;
  g.transmittance = s.transmittance;
  return encodeGBuffer(g, linearizeDepthReversedZ(input.position.z, view.near, view.far));
}

struct EmissiveOutput {
  @location(0) color: vec4f,
};

// additive glow pass of SkinPS (emittance onto the lit color)
@fragment
fn fs_emissive(input: FragmentInput) -> EmissiveOutput {
  let s = skinSurface(input); // also the alpha test and dissolve clip
  var out: EmissiveOutput;
  out.color = vec4f(skinEmittance(input.uvBase.zw) + skinRimLighting(s, input), 0.0);
  return out;
}

// forward shading, only used outside the deferred pipeline
@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let s = skinSurface(input);
  let toEye = normalize(input.viewVec);

  var surface: SurfaceParams;
  surface.Transmittance = vec4f(s.transmittance, 0.0);
  surface.LightingModel = LIGHTINGMODEL_TRANSMITTANCE;
  surface.Diffuse   = s.albedo;
  surface.Alpha     = 1.0;
  surface.Specular  = s.reflectance;
  surface.Normal    = vec4f(s.normal, 1.0);
  surface.Roughness = smoothnessToRoughness(s.smoothness);

  var shade = accumulateLightShade(lights, global, surface, toEye, input.worldPos);
  let reflectVec = normalize(reflect(-toEye, s.normal));
  let env = environmentLight(samplerLinear, lights, input.worldPos, s.normal, reflectVec, s.smoothness, vec3f(0.0));
  shade.ambient += env.diffuse;
  let envFresnel = environmentFresnel(s.reflectance, s.smoothness, dot(s.normal, toEye));
  shade.specular += env.specular * envFresnel * shade.ambientScale;
  let color = composeShade(surface, shade) + skinEmittance(input.uvBase.zw) + skinRimLighting(s, input);

  var out: FragmentOutput;
  out.color = applyFog(color, 1.0, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);
  return out;
}

struct DebugOutput {
  @location(0) color: vec4f,
};

// material debug view over the lit image (NwRenderVariant.Debug)
@fragment
fn fs_debug(input: FragmentInput) -> DebugOutput {
  let s = skinSurface(input);
  var color = vec4f(-1.0);
  switch (global.debug) {
    case DEBUG_MTL_ALBEDO: { color = vec4f(s.albedo, 1.0); }
    case DEBUG_MTL_SPECULAR: { color = vec4f(s.reflectance, 1.0); }
    case DEBUG_MTL_ROUGHNESS: { color = vec4f(vec3f(smoothnessToRoughness(s.smoothness)), 1.0); }
    case DEBUG_MTL_EMISSIVE: { color = vec4f(skinEmittance(input.uvBase.zw) + skinRimLighting(s, input), 1.0); }
    case DEBUG_MTL_OPACITY: { color = vec4f(s.transmittance, 1.0); }
    case DEBUG_GV_NORMAL: { color = vec4f(input.worldNormal * 0.5 + 0.5, 1.0); }
    case DEBUG_GV_TANGENT: { color = vec4f(input.worldTangent * 0.5 + 0.5, 1.0); }
    case DEBUG_GV_BITANGENT: { color = vec4f(input.worldBitangent * 0.5 + 0.5, 1.0); }
    case DEBUG_GV_SHADE_NORMAL: { color = vec4f(s.normal * 0.5 + 0.5, 1.0); }
    case DEBUG_V_UV0: { color = vec4f(fract(input.uvBase.xy), 0.0, 1.0); }
    default: {}
  }
  if (color.a < 0.0) {
    discard;
  }
  var out: DebugOutput;
  out.color = color;
  return out;
}

${COMMON_WGSL}
${GBUFFER_WGSL}
${PROBES_WGSL}
`
