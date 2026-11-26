import { COMMON_WGSL } from './common.wgsl'
import { GBUFFER_WGSL } from './gbuffer.wgsl'
import { PROBES_WGSL } from './probes.wgsl'

/**
 * Hair shader (hair.cfx): character hair, fur cards and feathers.
 *
 * The game draws hair into the GBuffer (ZPass, alpha tested) and shades it again after the tiled shading in a forward
 * opaque pass with depth EQUAL (Kajiya-Kay highlights, wrapped diffuse), followed by alpha blended front/back passes
 * for the soft edges. The viewer draws it once in the forward opaque pass (after the lighting, depth written,
 * alpha tested), which gives the same opaque result. Hair is not in the GBuffer, so the AO and decals skip it.
 *
 * Not ported:
 * - the blended front/back passes (soft edges, %THIN_HAIR), hair is a cutout at the material AlphaTest
 * - SSDO directional occlusion of the opaque pass, sun shadows (no shadow maps yet)
 * - %RIM_DIFFUSE_LIGHTING / %RIM_SPEC_LIGHTING (plan 2.1), SoftIntersection, %VIEW_ALIGNED_STRANDS, wind bending
 */
export default /* wgsl */ `
struct MaterialBlock {
  diffuseColor                 : vec4f, // PerMaterial_DiffuseColor
  specularColor                : vec4f, // PerMaterial_SpecularColor .xyz=spec color .w=smoothness

  alphaBlendMultiplier         : f32,   // default 1.0
  secondaryHighlightWidth      : f32,   // default 1.5
  secondaryHighlightShiftAmount: f32,   // default 0.1
  secondaryHighlightColor      : vec4f, // default 0.7, 0.7, 0.7, 1
  shiftVariation               : f32,   // default 0.0
  diffuseWrap                  : f32,   // default 0.5

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

  alphaTestRef          : f32,

  uvModDiffuse          : mat4x4f,
  enabledUvModDiffuse   : u32,   // _ModifyUV_1

  // xy = scale, bias of normalMap by its texture format (decodeNormalMap), zw unused
  normalMapEncoding     : vec4f,
};

@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear      : sampler;

@group(3) @binding(0) var diffuseMap   : texture_2d<f32>; // $Diffuse, .a = opacity
@group(3) @binding(1) var normalMap    : texture_2d<f32>; // $Normal
@group(3) @binding(2) var specularMap  : texture_2d<f32>; // $Specular
@group(3) @binding(3) var smoothnessMap: texture_2d<f32>; // $Smoothness
@group(3) @binding(4) var opacityMap   : texture_2d<f32>; // $Opacity: .g dissolve noise
@group(3) @binding(5) var maskMap      : texture_2d<f32>; // $CustomMap, overlay mask (MaskTex)
@group(3) @binding(6) var directionMap : texture_2d<f32>; // $Detail, %DIRECTION_MAP: tangent space hair direction

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
  @location(1) uvBase  : vec2f,
  @location(2) @interpolate(perspective, centroid) worldTangent  : vec3f,
  @location(3) @interpolate(perspective, centroid) worldBitangent: vec3f,
  @location(4) @interpolate(perspective, centroid) worldNormal   : vec3f,
  @location(5) viewVec    : vec3f,
  @location(6) vertexColor: vec4f,
  @location(7) dissolve   : f32,
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
  output.vertexColor    = input.color;
  output.dissolve       = instanceData[input.id].dissolveAmount;

  var uv = vec4f(input.texture.xy, 0.0, 1.0);
  if (material.enabledUvModDiffuse == TRUE) {
    uv = material.uvModDiffuse * uv;
  }
  output.uvBase = uv.xy;
  return output;
}

// KajiyaKayAnisotropic (ShadeLib.cfi)
fn kajiyaKay(T: vec3f, H: vec3f, exponent: f32) -> f32 {
  let TdotH = dot(T, H);
  return pow(sqrt(max(1.0 - TdotH * TdotH, 0.01)), exponent);
}

struct HairSurface {
  normal      : vec3f, // shading normal (normal map), facing the viewer
  vertexNormal: vec3f, // interpolated normal, facing the viewer
  color       : vec3f, // cHair
  specular    : vec3f, // specular map
  gloss       : f32,
  tangent     : vec3f, // primary highlight direction
  tangentSec  : vec3f, // secondary highlight direction
};

fn hairOverlayMaskParams() -> OverlayMaskParams {
  return OverlayMaskParams(
    material.maskR, material.maskRColor, material.maskROverride,
    material.maskG, material.maskGColor, material.maskGOverride,
    material.maskB, material.maskBColor, material.maskBOverride,
    material.maskAGloss, material.maskAGlossShift, material.maskASpecColor, material.maskASpecColorOverride,
  );
}

// frag_custom_begin of hair.cfx, with the alpha test of the ZPass. May discard.
fn hairSurface(input: FragmentInput, frontFacing: bool) -> HairSurface {
  ditherFade(input.position.xy, distance(view.cameraPosition, input.worldPos), input.dissolve);

  let uv = input.uvBase;
  let diffuse = textureSample(diffuseMap, samplerLinear, uv);
  let alpha = saturate(diffuse.a * material.alphaBlendMultiplier);
  if (alpha < material.alphaTestRef) {
    discard;
  }

  // two sided: back faces use the flipped frame
  let side = select(-1.0, 1.0, frontFacing);
  let tbn = mat3x3f(
    normalize(input.worldTangent),
    normalize(input.worldBitangent),
    normalize(input.worldNormal) * side,
  );
  var normal = tbn[2];
  if (NORMAL_MAP) {
    let n = decodeNormalMap(textureSample(normalMap, samplerLinear, uv).xy, material.normalMapEncoding.xy);
    normal = normalize(tbn * vec3f(n.xy, n.z));
  }

  var color = diffuse.rgb * material.diffuseColor.rgb;
  if (VERTCOLORS) {
    color *= input.vertexColor.rgb; // vertex alpha is reserved for wind bending
  }
  var specular = textureSample(specularMap, samplerLinear, uv).rgb;
  if (OVERLAY_MASK) {
    // the game passes a dummy gloss, the masking changes the hair color and the specular map only
    let mask = textureSample(maskMap, samplerLinear, uv);
    let masked = applyOverlayMask(OverlayMaskSurface(color, specular, 0.0), mask, hairOverlayMaskParams());
    color = masked.albedo;
    specular = masked.specular;
  }
  if (FX_DISSOLVE) {
    let noise = textureSample(opacityMap, samplerLinear, uv).g;
    color = clipDissolve(noise, material.dissolvePercentage, material.dissolveEdgeThickness, material.dissolveColor.rgb, color);
  }

  var hairDir = tbn[1];
  var shift = 0.0;
  if (DIRECTION_MAP) {
    let d = textureSample(directionMap, samplerLinear, uv).xy * 2.0 - 1.0;
    hairDir = tbn * vec3f(d, 0.0);
    // reconstructed z of the direction
    shift = sqrt(saturate(1.0 - dot(d, d))) * material.shiftVariation;
  }

  var s: HairSurface;
  s.normal       = normal;
  s.vertexNormal = tbn[2];
  s.color        = color;
  s.specular     = specular;
  s.gloss        = clamp(material.specularColor.w * textureSample(smoothnessMap, samplerLinear, uv).r, 0.5, 0.9);
  s.tangent      = normalize(hairDir + shift * normal);
  s.tangentSec   = normalize(hairDir + (shift + material.secondaryHighlightShiftAmount) * normal);
  return s;
}

struct HairShade {
  diffuse : vec3f,
  specular: vec3f,
};

// frag_custom_per_light of hair.cfx
fn shadeHairLight(acc: ptr<function, HairShade>, s: HairSurface, V: vec3f, light: LightResult) {
  let L = light.direction;
  let H = normalize(V + L);
  let NdotL = dot(s.normal, L);
  let NdotLVertex = dot(s.vertexNormal, L);

  // wrapped diffuse, normalized by (1 + wrap)^2 to conserve energy
  let wrap = 1.0 + material.diffuseWrap;
  let diffuse = saturate(((NdotL + NdotLVertex) * 0.5 + material.diffuseWrap) / (wrap * wrap));

  let specColor = min(s.specular * material.specularColor.rgb, vec3f(0.045));
  var spec = kajiyaKay(s.tangent, H, exp2(10.0 * s.gloss + 1.0)) * specColor;
  // secondary highlight: reflected back after entering the strand
  let secWidth = max(1.0, material.secondaryHighlightWidth);
  spec += kajiyaKay(s.tangentSec, H, exp2(10.0 * max(s.gloss / secWidth, 0.4) + 1.0))
        * material.secondaryHighlightColor.rgb * s.color * s.specular;
  spec *= saturate(NdotL);

  (*acc).diffuse  += diffuse * light.diffuse * light.falloff;
  (*acc).specular += spec * light.specular * light.falloff;
}

@fragment
fn fs_main(input: FragmentInput, @builtin(front_facing) frontFacing: bool) -> FragmentOutput {
  let s = hairSurface(input, frontFacing);
  let V = normalize(input.viewVec);

  var acc: HairShade;
  var sun: LightParams;
  sun.Color = global.sunColor.xyzw;
  sun.Direction = vec4f(global.sunDirection, 0.0);
  shadeHairLight(&acc, s, V, getLight(sun, LIGHT_TYPE_DIRECTIONAL, input.worldPos));

  var ambientScale = vec3f(1.0);
  let clusterIndex = getLightClusterIndex(lights, input.worldPos);
  if (clusterIndex >= 0) {
    let cluster = lightClusters[clusterIndex];
    let reflectDir = reflect(-V, s.normal);
    for (var i = 0u; i < cluster.count; i++) {
      let light = lightList[lightIndices[cluster.offset + i].light];
      if (lightHasFlag(light, LIGHT_FLAG_FOG_ONLY | LIGHT_FLAG_PROBE)) {
        continue;
      }
      let result = getClusterLight(light, input.worldPos, reflectDir);
      if (result.falloff <= 0.0) {
        continue;
      }
      if (lightIsAmbient(light)) {
        var shade: ShadeOutput;
        shade.ambientScale = ambientScale;
        var surface: SurfaceParams;
        surface.Normal = vec4f(s.normal, 1.0);
        shadeAmbientLight(&shade, surface, light, result);
        ambientScale = shade.ambientScale;
      } else {
        shadeHairLight(&acc, s, V, result);
      }
    }
  }

  // probes, diffuse only (TiledForwardProbes(pPass, true))
  let env = environmentLight(samplerLinear, lights, input.worldPos, s.normal, s.normal, 0.0, vec3f(0.0));
  let ambient = env.diffuse * ambientScale;
  let color = (ambient + acc.diffuse) * s.color + acc.specular;

  var out: FragmentOutput;
  out.color = applyFog(color, 1.0, input.worldPos, view.cameraPosition);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);

  switch (global.debug) {
    case DEBUG_MTL_ALBEDO: {
      out.color = vec4f(s.color, 1.0);
    }
    case DEBUG_MTL_SPECULAR: {
      out.color = vec4f(s.specular, 1.0);
    }
    case DEBUG_MTL_ROUGHNESS: {
      out.color = vec4f(vec3f(smoothnessToRoughness(s.gloss)), 1.0);
    }
    case DEBUG_GV_NORMAL: {
      out.color = vec4f(s.vertexNormal * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_TANGENT: {
      out.color = vec4f(s.tangent * 0.5 + 0.5, 1.0);
    }
    case DEBUG_GV_SHADE_NORMAL: {
      out.color = vec4f(s.normal * 0.5 + 0.5, 1.0);
    }
    case DEBUG_V_COLOR0: {
      out.color = vec4f(input.vertexColor.rgb, 1.0);
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(fract(input.uvBase), 0.0, 1.0);
    }
    default: {
      //
    }
  }
  return out;
}

${COMMON_WGSL}
${GBUFFER_WGSL}
${PROBES_WGSL}
`
