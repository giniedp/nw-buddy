import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'
import { PROBES_WGSL } from './probes.wgsl'

/**
 * The material of glTF files (core metallic roughness, KHR_materials_specular, KHR_materials_ior,
 * KHR_materials_emissive_strength, KHR_texture_transform of the base map), lit like the game materials:
 * opaque and masked surfaces write the GBuffer (fs_gbuffer) and the deferred lighting lights them, blended surfaces
 * are lit forward (fs_main). Emittance is added after the lighting (fs_emissive).
 *
 * The metallic roughness inputs become the albedo, reflectance (F0) and smoothness of the viewer's surfaces.
 */
export default /* wgsl */ `
struct MaterialBlock {
  baseColor        : vec4f,   // .rgb linear color, .a opacity
  emissiveColor    : vec4f,   // .rgb linear color, .a strength (KHR_materials_emissive_strength)
  specularColor    : vec4f,   // .rgb KHR_materials_specular color, .a specular weight (specularFactor)
  textureMod       : mat4x4f, // uv transform of the base map, used for all maps (KHR_texture_transform)
  metallic         : f32,
  roughness        : f32,
  ior              : f32,     // 0: the specular color is F0 (the specular workflow of the nwbt exports)
  alphaClip        : f32,     // alpha test threshold, 0 without
  alphaBlend       : u32,
  useBaseMap       : u32,
  useMetallicRoughnessMap : u32,
  useNormalMap     : u32,
  normalSigned     : u32,     // normal map in a signed format (BC5_SNORM of game files), xy without remap
  useOcclusionMap  : u32,
  useEmissiveMap   : u32,
  useSpecularMap   : u32,
  useTextureMod    : u32,
};

@group(2) @binding(0) var<uniform> material: MaterialBlock;
@group(2) @binding(1) var baseMapSampler              : sampler;
@group(2) @binding(2) var metallicRoughnessMapSampler : sampler;
@group(2) @binding(3) var normalMapSampler            : sampler;
@group(2) @binding(4) var occlusionMapSampler         : sampler;
@group(2) @binding(5) var emissiveMapSampler          : sampler;
@group(2) @binding(6) var specularMapSampler          : sampler;
// sky cube of the environment functions (probes.wgsl)
@group(2) @binding(7) var samplerLinear               : sampler;

@group(3) @binding(0) var baseMap              : texture_2d<f32>; // sRGB, .a opacity
@group(3) @binding(1) var metallicRoughnessMap : texture_2d<f32>; // .g roughness, .b metallic
@group(3) @binding(2) var normalMap            : texture_2d<f32>;
@group(3) @binding(3) var occlusionMap         : texture_2d<f32>; // .r
@group(3) @binding(4) var emissiveMap          : texture_2d<f32>; // sRGB
@group(3) @binding(5) var specularMap          : texture_2d<f32>; // .rgb specular color, .a specular weight

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
  @location(1) texture : vec2f,
  @location(2) normal  : vec3f,
  @location(3) tangent : vec4f, // .w = handedness, zero without tangents (a cotangent frame is used then)
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0) worldPos : vec3f,
  @location(1) uv       : vec2f,
  @location(2) @interpolate(perspective, centroid) worldNormal  : vec3f,
  @location(3) @interpolate(perspective, centroid) worldTangent : vec4f, // .w = handedness
  @location(4) toEye    : vec3f,
  @location(5) dissolve : f32,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let modelMatrix = object[input.id].modelMatrix;
  let worldPos = modelMatrix * vec4f(input.position, 1.0);

  var output: FragmentInput;
  output.position     = view.projectionMatrix * (view.viewMatrix * worldPos);
  output.worldPos     = worldPos.xyz;
  output.worldNormal  = normalize((modelMatrix * vec4f(input.normal, 0.0)).xyz);
  output.worldTangent = vec4f((modelMatrix * vec4f(input.tangent.xyz, 0.0)).xyz, input.tangent.w);
  output.toEye        = view.cameraPosition - worldPos.xyz;
  output.dissolve     = instanceData[input.id].dissolveAmount;
  var uv = input.texture;
  if (material.useTextureMod == TRUE) {
    uv = (material.textureMod * vec4f(uv, 0.0, 1.0)).xy;
  }
  output.uv = uv;
  return output;
}

// Surface attributes of a fragment, shared by the entry points
struct GltfSurface {
  albedo     : vec3f,
  specular   : vec3f, // F0
  smoothness : f32,
  alpha      : f32,
  normal     : vec3f, // world space
  ao         : f32,
  toEye      : vec3f,
  emittance  : vec3f,
};

fn gltfNormal(input: FragmentInput, normal: vec3f) -> vec3f {
  if (material.useNormalMap != TRUE) {
    return normal;
  }
  let encoded = textureSample(normalMap, normalMapSampler, input.uv);
  var xy = encoded.xy;
  if (material.normalSigned != TRUE) {
    xy = xy * 2.0 - 1.0;
  }
  let tangentNormal = decodeNormal(xy);
  // derivatives in uniform control flow, before the per vertex choice
  var tbn = getCotangentFrame(input.worldPos, normal, input.uv);
  let tangentLength = length(input.worldTangent.xyz);
  if (tangentLength > 0.0 && input.worldTangent.w != 0.0) {
    let tangent = input.worldTangent.xyz / tangentLength;
    let bitangent = cross(normal, tangent) * input.worldTangent.w;
    tbn = mat3x3f(tangent, bitangent, normal);
  }
  return normalize(tbn * tangentNormal);
}

fn gltfSurface(input: FragmentInput, frontFacing: bool) -> GltfSurface {
  var base = material.baseColor;
  if (material.useBaseMap == TRUE) {
    base *= textureSample(baseMap, baseMapSampler, input.uv);
  }
  if (material.alphaClip > 0.0 && base.a < material.alphaClip) {
    discard;
  }
  ditherFade(input.position.xy, 0.0, input.dissolve);

  var metallic = material.metallic;
  var roughness = material.roughness;
  if (material.useMetallicRoughnessMap == TRUE) {
    let mr = textureSample(metallicRoughnessMap, metallicRoughnessMapSampler, input.uv);
    roughness *= mr.g;
    metallic *= mr.b;
  }
  metallic = saturate(metallic);
  roughness = saturate(roughness);

  // dielectric F0: from the index of refraction, scaled by KHR_materials_specular. ior 0 makes the specular color F0.
  var f0 = vec3f(1.0);
  if (material.ior > 0.0) {
    let r = (material.ior - 1.0) / (material.ior + 1.0);
    f0 = vec3f(r * r);
  }
  var specularColor = material.specularColor.rgb;
  var specularWeight = material.specularColor.a;
  if (material.useSpecularMap == TRUE) {
    let spec = textureSample(specularMap, specularMapSampler, input.uv);
    specularColor *= spec.rgb;
    specularWeight *= spec.a;
  }
  let dielectricF0 = min(f0 * specularColor, vec3f(1.0)) * specularWeight;

  var normal = normalize(input.worldNormal);
  if (!frontFacing) {
    normal = -normal;
  }

  var s: GltfSurface;
  s.albedo     = base.rgb * (1.0 - metallic);
  s.specular   = mix(dielectricF0, base.rgb, metallic);
  s.smoothness = 1.0 - roughness;
  s.alpha      = base.a;
  s.normal     = gltfNormal(input, normal);
  s.toEye      = normalize(input.toEye);
  s.ao         = 1.0;
  if (material.useOcclusionMap == TRUE) {
    s.ao = textureSample(occlusionMap, occlusionMapSampler, input.uv).r;
  }
  s.emittance = material.emissiveColor.rgb * material.emissiveColor.a;
  if (material.useEmissiveMap == TRUE) {
    s.emittance *= textureSample(emissiveMap, emissiveMapSampler, input.uv).rgb;
  }
  return s;
}

// Blended surfaces, lit forward like the game's transparent materials
@fragment
fn fs_main(input: FragmentInput, @builtin(front_facing) frontFacing: bool) -> FragmentOutput {
  let s = gltfSurface(input, frontFacing);

  var surface: SurfaceParams;
  surface.LightingModel = LIGHTINGMODEL_STANDARD;
  surface.Diffuse   = s.albedo;
  surface.Alpha     = s.alpha;
  surface.Specular  = s.specular;
  surface.Normal    = vec4f(s.normal, 1.0);
  surface.Roughness = smoothnessToRoughness(s.smoothness);

  let reflectVec = normalize(reflect(-s.toEye, s.normal));
  let env = environmentLight(samplerLinear, lights, input.worldPos, s.normal, reflectVec, s.smoothness, vec3f(0.0));
  var shade = accumulateLightShade(lights, global, surface, s.toEye, input.worldPos);
  shade.ambient += env.diffuse * s.ao;
  let envFresnel = environmentFresnel(s.specular, s.smoothness, dot(s.normal, s.toEye));
  shade.specular += env.specular * s.ao * envFresnel * shade.ambientScale;
  let color = composeShade(surface, shade) + s.emittance;

  var out: FragmentOutput;
  out.color = applyFog(color, select(1.0, s.alpha, material.alphaBlend == TRUE), input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);
  return out;
}

// Opaque and masked surfaces, lit by the deferred lighting pass
@fragment
fn fs_gbuffer(input: FragmentInput, @builtin(front_facing) frontFacing: bool) -> GBufferOutput {
  let s = gltfSurface(input, frontFacing);
  var g: GBufferSurface;
  g.normal        = s.normal;
  g.albedo        = s.albedo;
  g.reflectance   = s.specular;
  g.smoothness    = s.smoothness;
  g.occlusion     = s.ao;
  g.lightingModel = LIGHTINGMODEL_STANDARD;
  g.transmittance = vec3f(0.0);
  return encodeGBuffer(g, linearizeDepthReversedZ(input.position.z, view.near, view.far));
}

struct EmissiveOutput {
  @location(0) color: vec4f,
};

// Emittance added to the deferred lit color, see NwRenderVariant.Emissive
@fragment
fn fs_emissive(input: FragmentInput, @builtin(front_facing) frontFacing: bool) -> EmissiveOutput {
  let s = gltfSurface(input, frontFacing);
  var out: EmissiveOutput;
  out.color = vec4f(s.emittance, 0.0);
  return out;
}

${COMMON_WGSL}
${GBUFFER_WGSL}
${PROBES_WGSL}
`
