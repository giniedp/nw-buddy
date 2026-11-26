import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'
import { ILLUM_MATERIAL_WGSL } from './IllumMaterial.wgsl'

/**
 * Projected (deferred) decals of Illum %DECAL materials, a port of the game's `DecalPassPS` and `DecalEmissivePassPS`
 * (deferredshading.cfx) for the box volumes of DecalComponents (plan 7.7).
 *
 * The box geometry is the volume of the game's decal projection in decal space (x, y in [-1, 1], z in [-0.5, 0.3]),
 * the model matrix is the decal matrix (entity world × offset × scale(1, 1, depth)). The pixel position comes from
 * LinearDepth, it is projected into the texture space of the box like `GetDecalLightProjMatrix`:
 * u = x / 2 + 0.5, v = 0.5 - y / 2, w = (0.3 - z) / 0.8. Pixels outside the box are discarded.
 *
 * Drawn with back faces and a reversed-z `less-equal` test (the scene lies in front of the far side of the box), so
 * the camera may be inside the box. The game draws front faces with LEQUAL and switches to back faces with GREATER
 * when the near plane cuts the box.
 */
export default /* wgsl */ `
${ILLUM_MATERIAL_WGSL}

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;

@group(1) @binding(0) var<storage, read> object       : array<ObjectBlock>; // per instance data
@group(1) @binding(1) var<storage, read> instanceData : array<InstanceDataBlock>; // per instance data

// linear view depth of the scene (LinearDepth)
// @block view
// @unfilterable
@group(1) @binding(2) var sceneDepthMap : texture_2d<f32>;
// receiver normals for the angle fade, a copy of GBuffer A (the game's normals copy in _tex6)
// @block view
@group(1) @binding(3) var decalNormalMap : texture_2d<f32>;

struct DecalVertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3f,
};

struct DecalFragmentInput {
  @builtin(position) position: vec4f,
  // rows of the world → decal space matrix (the inverse of the model matrix), w = translation
  @location(0) @interpolate(flat) toDecal0: vec4f,
  @location(1) @interpolate(flat) toDecal1: vec4f,
  @location(2) @interpolate(flat) toDecal2: vec4f,
  // normalized decal axes (g_mDecalTS), axisX.w = decal size (2 × the larger half extent), axisY.w = opacity
  @location(3) @interpolate(flat) axisX: vec4f,
  @location(4) @interpolate(flat) axisY: vec4f,
  @location(5) @interpolate(flat) axisZ: vec3f,
};

// near and far plane of the decal projection in decal space (GetDecalLightProjMatrix)
const DECAL_Z_NEAR: f32 = -0.3;
const DECAL_Z_FAR: f32 = 0.5;
// angle fade clamp of the game (getDecalAttenuation)
const DECAL_CLAMP_ANGLE: f32 = 0.55;

@vertex
fn vs_decal(input: DecalVertexInput) -> DecalFragmentInput {
  let m = object[input.id].modelMatrix;
  let c0 = m[0].xyz;
  let c1 = m[1].xyz;
  let c2 = m[2].xyz;
  let t  = m[3].xyz;
  // inverse of the affine model matrix, the rows of inverse(mat3(c0, c1, c2)) are the cross products / det
  let invDet = 1.0 / dot(c0, cross(c1, c2));
  let r0 = cross(c1, c2) * invDet;
  let r1 = cross(c2, c0) * invDet;
  let r2 = cross(c0, c1) * invDet;

  var output: DecalFragmentInput;
  output.position = view.projectionMatrix * view.viewMatrix * (m * vec4f(input.position, 1.0));
  output.toDecal0 = vec4f(r0, -dot(r0, t));
  output.toDecal1 = vec4f(r1, -dot(r1, t));
  output.toDecal2 = vec4f(r2, -dot(r2, t));
  output.axisX    = vec4f(normalize(c0), 2.0 * max(length(c0), length(c1)));
  output.axisY    = vec4f(normalize(c1), instanceData[input.id].decalOpacity);
  output.axisZ    = normalize(c2);
  return output;
}

// projected decal sample position of a pixel
struct DecalPixel {
  pixel    : vec2i,
  worldPos : vec3f,
  // xy = decal texture coordinates, z = depth in the projection (0 at the near plane, 1 at the far plane)
  projTC   : vec3f,
  // manual mip level input of getDecalMipLevels: distance / NdotV and the aniso bias
  distOverNdotV : f32,
  mipBias  : f32,
};

// reconstructs the pixel position from LinearDepth and projects it into the decal box, discards outside the box
fn decalPixel(input: DecalFragmentInput) -> DecalPixel {
  var d: DecalPixel;
  d.pixel = vec2i(input.position.xy);
  let depth = textureLoad(sceneDepthMap, d.pixel, 0).r;
  // no geometry (LinearDepth is cleared to the far plane)
  if (depth <= 0.0 || depth >= view.far) {
    discard;
  }
  // the far plane lies at the view depth view.far (same as the LightingPass)
  let farPos = farPlaneWorldPos(input.position.xy);
  d.worldPos = view.cameraPosition + (farPos - view.cameraPosition) * (depth / view.far);

  let p = vec4f(d.worldPos, 1.0);
  let local = vec3f(dot(input.toDecal0, p), dot(input.toDecal1, p), dot(input.toDecal2, p));
  d.projTC = vec3f(
    local.x * 0.5 + 0.5,
    0.5 - local.y * 0.5,
    (local.z + DECAL_Z_NEAR) / (DECAL_Z_NEAR - DECAL_Z_FAR),
  );
  if (any(d.projTC < vec3f(0.0)) || any(d.projTC > vec3f(1.0))) {
    discard;
  }

  // getDecalMipLevels: lod = log2(mipFactor × distance / NdotV) - lerp(1.5, 0.5, NdotV), "very simple aniso"
  let toPixel = d.worldPos - view.cameraPosition;
  let NdotV = max(0.01, abs(dot(input.axisZ, normalize(toPixel))));
  d.distOverNdotV = length(toPixel) / NdotV;
  d.mipBias = mix(1.5, 0.5, NdotV);
  return d;
}

// depth fade of the projection and angle fade against the receiver normal (getDecalAttenuation)
fn decalAttenuation(d: DecalPixel, axisZ: vec3f) -> f32 {
  // longer under the decal, 4x shorter in front of it
  let z = d.projTC.z;
  let s = (z - 0.2) * select(1.2, 5.0, z < 0.2);
  var atten = saturate(1.0 - s * s);
  let receiver = gbufferDecodeNormal(textureLoad(decalNormalMap, d.pixel, 0).rgb);
  let fDot = clamp(dot(receiver, axisZ), DECAL_CLAMP_ANGLE, 1.0);
  atten *= smoothstep(DECAL_CLAMP_ANGLE, 1.0, fDot);
  return atten;
}

// mip level factor of the decal (CDeferredShading::SetTexture): tan(fov) × tiling / (decal size × screen resolution),
// with fov the vertical field of view and the resolution (width + height) / 2. The game computes it from the diffuse
// texture transform and uses it for all textures of the decal.
// tan(fov) / screenRes stands for the view space size of a pixel at distance 1. That only holds for narrow fields of
// view (the game's ~60°); toward 90° tan(fov) grows without bound and selects the smallest mips. So this uses the
// exact pixel size 2 tan(fov / 2) / height, which is within ~10% of the game's value at 60° and 16:9.
fn decalMipFactor(decalSize: f32, uvMod: mat4x4f, uvModEnabled: u32) -> f32 {
  let pixelSize = 2.0 / (view.projectionMatrix[1][1] * view.viewportSize.y);
  var tiling = 1.0;
  if (uvModEnabled == TRUE) {
    tiling = max(length(uvMod[0].xy), length(uvMod[1].xy));
  }
  return pixelSize * tiling / max(decalSize, EPSILON);
}

fn decalMip(d: DecalPixel, mipFactor: f32, size: vec2u) -> f32 {
  let texels = f32(max(size.x, size.y));
  return max(log2(max(mipFactor * texels * d.distOverNdotV, EPSILON)) - d.mipBias, 0.0);
}

fn decalTransformTC(uv: vec2f, uvMod: mat4x4f, uvModEnabled: u32) -> vec2f {
  if (uvModEnabled == TRUE) {
    return (uvMod * vec4f(uv, 0.0, 1.0)).xy;
  }
  return uv;
}

// the opacity mask is not tiled, the game samples it with clamp addressing. The material sampler wraps,
// so the coordinate is kept half a texel inside the edges of the mip
fn decalClampTC(uv: vec2f, size: vec2u, mip: f32) -> vec2f {
  let mipSize = max(vec2f(size) / exp2(floor(mip)), vec2f(1.0));
  let half = 0.5 / mipSize;
  return clamp(uv, half, 1.0 - half);
}

struct DecalOutput {
  @location(0) a: vec4f,
  @location(1) b: vec4f,
  @location(2) c: vec4f,
};

// GBuffer attributes of a projected decal with the alpha of each target (EncodeGBuffer + SetGBufferBlending),
// blended SRC_ALPHA / ONE_MINUS_SRC_ALPHA with color mask RGB by the effect
@fragment
fn fs_decal(input: DecalFragmentInput) -> DecalOutput {
  let d = decalPixel(input);
  let atten = decalAttenuation(d, input.axisZ);

  let mipFactor = decalMipFactor(input.axisX.w, material.uvModDiffuse, material.enabledUvModDiffuse);
  let diffuseTC = decalTransformTC(d.projTC.xy, material.uvModDiffuse, material.enabledUvModDiffuse);

  let diffuse = textureSampleLevel(diffuseMap, samplerLinear, diffuseTC,
    decalMip(d, mipFactor, textureDimensions(diffuseMap)));
  let opacitySize = textureDimensions(opacityMap);
  let opacityMip = decalMip(d, mipFactor, opacitySize);
  let opacity = textureSampleLevel(opacityMap, samplerLinear, decalClampTC(d.projTC.xy, opacitySize, opacityMip),
    opacityMip).r;

  // normal map in the decal tangent frame (g_mDecalTS: x, -y, z)
  var normal = input.axisZ;
  if (NORMAL_MAP) {
    let n = decodeNormalMap(textureSampleLevel(normalMap, samplerLinear, diffuseTC,
      decalMip(d, mipFactor, textureDimensions(normalMap))).xy, material.normalMapEncoding.xy);
    normal = normalize(input.axisX.xyz * n.x - input.axisY.xyz * n.y + input.axisZ * n.z);
  }

  let gloss = material.specularColor.w * textureSampleLevel(smoothnessMap, samplerLinear, diffuseTC,
    decalMip(d, mipFactor, textureDimensions(smoothnessMap))).r;

  // g_DecalDiffuse.w = material opacity × component opacity
  var alpha = diffuse.a * opacity * material.diffuseColor.w * input.axisY.w * atten;
  alpha = saturate(pow(alpha * material.decalAlphaMult, material.decalFalloff));
  let alphaDiffuse = alpha * material.decalDiffuseOpacity;
  let alphaNormal = select(0.0, alpha, NORMAL_MAP);
  if (alphaDiffuse < 0.01) {
    discard;
  }

  var g: GBufferSurface;
  g.normal        = normal;
  g.albedo        = diffuse.rgb * material.diffuseColor.rgb;
  g.reflectance   = vec3f(getLuminance(material.specularColor.rgb));
  g.smoothness    = gloss;
  g.occlusion     = 1.0;
  g.lightingModel = LIGHTINGMODEL_STANDARD;
  g.transmittance = vec3f(0.0);
  let e = encodeGBuffer(g, 0.0);

  var out: DecalOutput;
  out.a = vec4f(e.a.rgb, alphaNormal);
  out.b = vec4f(e.b.rgb, alphaDiffuse);
  out.c = vec4f(e.c.rgb, alpha);
  return out;
}

struct DecalEmissiveOutput {
  @location(0) color: vec4f,
};

// emittance of a projected decal added to the lit color (DecalEmissivePassPS, ONE / ONE)
@fragment
fn fs_decal_emissive(input: DecalFragmentInput) -> DecalEmissiveOutput {
  let d = decalPixel(input);
  let mipFactor = decalMipFactor(input.axisX.w, material.uvModEmittance, material.enabledUvModEmittance);

  var emittance = vec4f(1.0);
  var intensity = vec3f(0.5);
  if (EMITTANCE_MAP) {
    let emittanceTC = decalTransformTC(d.projTC.xy, material.uvModEmittance, material.enabledUvModEmittance);
    emittance = textureSampleLevel(emittanceMap, samplerLinear, emittanceTC,
      decalMip(d, mipFactor, textureDimensions(emittanceMap)));
    let intensityTC = decalTransformTC(d.projTC.xy, material.uvModDecalEmissive, material.enabledUvModDecalEmissive);
    intensity = textureSampleLevel(decalEmissiveMap, samplerLinear, intensityTC,
      decalMip(d, mipFactor, textureDimensions(decalEmissiveMap))).rgb;
  }
  let opacitySize = textureDimensions(opacityMap);
  let opacityMip = decalMip(d, mipFactor, opacitySize);
  emittance.a *= textureSampleLevel(opacityMap, samplerLinear, decalClampTC(d.projTC.xy, opacitySize, opacityMip),
    opacityMip).r;

  var color = emittance.rgb * pow(max(getLuminance(emittance.rgb), 1e-6), material.emittanceMapGamma - 1.0);
  color *= intensity;
  color *= material.emissiveColor.rgb * (emittance.a * material.emissiveColor.a * EMITTANCE_TO_ENGINE_LIGHT_SCALE);

  let alpha = saturate(pow(decalAttenuation(d, input.axisZ) * material.decalAlphaMult, material.decalFalloff));
  var out: DecalEmissiveOutput;
  out.color = vec4f(color * alpha, 0.0);
  return out;
}

${COMMON_WGSL}
${GBUFFER_WGSL}
`
