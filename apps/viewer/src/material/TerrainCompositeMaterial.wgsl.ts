export default /* wgsl */ `

struct VSOutput {
  @builtin(position) position : vec4f,
  @location(0) uvBase : vec2<f32>,
  @location(1) uvRegion : vec2<f32>,
  @location(2) uvMaterial : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VSOutput {
  var pos = vec2<f32>(
    select(-1.0, 3.0, vertexIndex == 2u),
    select(-1.0, 3.0, vertexIndex == 1u)
  );
  let uv = pos * 0.5 + vec2<f32>(0.5);

  var out : VSOutput;
  out.position = vec4f(pos, 0.0, 1.0);
  out.uvBase = uv;
  out.uvRegion = uv * params.regionScaleOffset.xy + params.regionScaleOffset.zw;
  out.uvMaterial = uv * params.tilingScaleOffset.xy + params.tilingScaleOffset.zw;
  out.uvMaterial = out.uvMaterial * params.tiling;
  return out;
}

struct Uniforms {
  // transform into region space
  regionScaleOffset : vec4f,
  // tiling scale and offset for all material maps
  tilingScaleOffset: vec4f,

  baseColor: vec4f,
  specularColor: vec4f,
  debugColor: vec4f, // debug color for visualization, alpha is used as a flag to indicate debug mode
  // g_macroMaterialDiffuseColor, multiplies the macro color map
  macroColor: vec4f,
  // PerMaterial_SpecularColor.w (Shininess / 255), multiplies the smoothness map
  gloss: f32,

  // Scales the saturation of the macro texture before an Overlay Blend with the material's diffuse texture
  macroSaturation: f32,
  // Scales influence of the Macro Diffuse on the final diffuse color
  macroBlendStrength: f32,
  // Scales influence of the Macro Gloss on the final gloss value
  macroGlossBlendStrength: f32,

  macroGlossScale: f32,
  macroNormalScale: f32,

  materialBlendFactor: f32,
  materialBlendFalloff: f32,
  materialHeightScale: f32,
  materialHeightOffset: f32,

  tiling: vec2f,
};

@group(0) @binding(0)
var<uniform> params : Uniforms;

@group(1) @binding(0) var macroSampler    : sampler;
@group(1) @binding(1) var macroBaseMap    : texture_2d<f32>; // rgb base color
@group(1) @binding(2) var macroNormalMap  : texture_2d<f32>; // xy normal, signed normalized
@group(1) @binding(3) var macroGlossMap   : texture_2d<f32>; // single channel gloss

@group(2) @binding(0) var materialSampler : sampler;
@group(2) @binding(1) var splatMap        : texture_2d<f32>; // single channel splat weight
@group(2) @binding(2) var baseMap         : texture_2d<f32>; // rgb base color
@group(2) @binding(3) var normalMap       : texture_2d<f32>; // xy normal, signed normalized
@group(2) @binding(4) var specularMap     : texture_2d<f32>; // rgb reflectance
@group(2) @binding(5) var smoothnessMap   : texture_2d<f32>; // single channel smoothness/gloss
@group(2) @binding(6) var heightMap       : texture_2d<f32>; // single channel height/displacement


struct FSOutput {
  @location(0) map1 : vec4f,
  @location(1) map2 : vec4f,
  @location(2) map3 : vec4f,
};

@fragment
fn fs(in: VSOutput) -> FSOutput {

  // with GPU mip selection, tiles dip to black
  // thisis expected and the tile should be instructed to render macro only (no splat)
  // but when splat is used, only options are
  // 1) textureSampleLoad(..., 0) to force mip 0, but this causes aliasing when the tile is minified
  // 2) textureSampleBias(..., -bias) also causes aliasing
  // TODO: review this

  let mipBias = 0.0;
  // Material input
  var matNormal     : vec3f = textureSampleBias(normalMap, materialSampler, in.uvMaterial, mipBias).rgb;
  var matColor      : vec3f = textureSampleBias(baseMap, materialSampler, in.uvMaterial, mipBias).rgb * params.baseColor.rgb;
  var matSpecular   : vec3f = textureSampleBias(specularMap, materialSampler, in.uvMaterial, mipBias).rgb * params.specularColor.rgb;
  var matSmoothness : f32   = textureSampleBias(smoothnessMap, materialSampler, in.uvMaterial, mipBias).r * params.gloss;
  var matHeight     : f32   = saturate(textureSampleBias(heightMap, materialSampler, in.uvMaterial, mipBias).r * params.materialHeightScale + params.materialHeightOffset);

  // Splat / blend input
  let splatValue  = textureSample(splatMap, macroSampler, in.uvRegion).r;
  let blendWeight = materialBlend(matHeight, splatValue, params.materialBlendFactor, params.materialBlendFalloff);

  // Macro input
  let macroBase         = textureSample(macroBaseMap, macroSampler, in.uvRegion).rgb * params.macroColor.rgb;
  let macroNormalSample = textureSample(macroNormalMap, macroSampler, in.uvRegion).rgb;
  let macroNormal       = normalize(vec3f(macroNormalSample.xy, 1.0 / params.macroNormalScale));
  let macroGloss        = textureSample(macroGlossMap, macroSampler, in.uvRegion).r * params.macroGlossScale;

  // macro saturation
  let macroLuminance = luminance(macroBase);
  let macroBaseMod = mix(vec3f(macroLuminance), macroBase, params.macroSaturation);
  let macroBaseResult = overlayBlendV3(macroBaseMod, matColor.rgb);

  matColor = mix(matColor, macroBaseResult, params.macroBlendStrength);
  matColor = mix(matColor, params.debugColor.rgb, params.debugColor.a);

  // macro gloss
  let macroGlossMod = overlayBlend(macroGloss, matSmoothness);
  matSmoothness = mix(matSmoothness, macroGlossMod, params.macroGlossBlendStrength);

  // macro normals
  matNormal = normalize(vec3(macroNormal.xy * params.macroNormalScale + matNormal.xy, macroNormal.z));

  //
  let normal = matNormal * 0.5 + 0.5;
  let color1 = matColor;
  let color2 = vec3f(matSmoothness, matSpecular.x, normal.y);
  let color3 = vec3f(normal.x, matHeight, 0.0);

  var out : FSOutput;
  out.map1 = vec4f(color1 * blendWeight, blendWeight);
  out.map2 = vec4f(color2 * blendWeight, blendWeight);
  out.map3 = vec4f(color3 * blendWeight, blendWeight);
  return out;
}

fn luminance(color: vec3f) -> f32 {
	return dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
}

fn overlayBlend(base: f32, top: f32) -> f32 {
  if (base < 0.5) {
    return 2.0 * base * top;
  }
  return 1.0 - (2.0 * (1.0 - base) * (1.0 - top));
}

fn overlayBlendV3(base: vec3f, top: vec3f) -> vec3f {
  let out0 = 2.0 * base * top;
  let out1 = 1.0 - (2.0 * (1.0 - base) * (1.0 - top));
  return mix(out0, out1, step(vec3f(0.5), base));
}

fn materialBlend(heightMapSample: f32, splatWeight: f32, blendFactor: f32, blendFalloff: f32) -> f32 {
  let heightMapBlendFactor = saturate(saturate(splatWeight * 2 - 1) + heightMapSample);
  let finalBlendFactor = splatWeight * heightMapBlendFactor * (1 + blendFactor);
  return saturate(pow(finalBlendFactor, blendFalloff));
}

fn decodeNormal(encoded: vec2<f32>) -> vec3f {
  let xy = encoded;
  let z = sqrt(clamp(1.0 - dot(xy, xy), 0.0, 1.0));
  return normalize(vec3f(xy, z));
}
`
