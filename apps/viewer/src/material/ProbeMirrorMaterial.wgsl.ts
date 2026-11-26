import { COMMON_WGSL } from './common.wgsl'

/**
 * Debug view of a probe cube on a mirror sphere. Cubes are sampled with the plain world direction,
 * like the engine does (TiledShading.cfi). The sky cube needs cryVecToGLTF, baked cubes do not.
 */
export default /* wgsl */ `

struct MaterialBlock {
  sphere : vec4f, // xyz = center, w = radius
  params : vec4f, // x = slot, y = specular lod, z = 1 shows the diffuse cube
};

// @private
@group(0) @binding(0) var<uniform> global: GlobalBlock;
// @private
@group(0) @binding(1) var<uniform> view: ViewBlock;

@group(2) @binding(0) var<uniform> material: MaterialBlock;
@group(2) @binding(1) var samplerLinear: sampler;

@group(3) @binding(0) var specularCubes: texture_cube_array<f32>;
@group(3) @binding(1) var diffuseCubes: texture_cube_array<f32>;

struct VertexInput {
  @location(0) position: vec3f,
};

struct FragmentInput {
  @builtin(position) position: vec4f,
  @location(0)       worldPos: vec3f,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  var output: FragmentInput;
  output.worldPos = material.sphere.xyz + input.position * material.sphere.w;
  output.position = view.projectionMatrix * view.viewMatrix * vec4f(output.worldPos, 1.0);
  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let normal = normalize(input.worldPos - material.sphere.xyz);
  let toSurface = normalize(input.worldPos - view.cameraPosition);
  let slot = i32(material.params.x);

  var color: vec3f;
  if (material.params.z > 0.5) {
    color = textureSampleLevel(diffuseCubes, samplerLinear, normal, slot, 0.0).rgb;
  } else {
    color = textureSampleLevel(specularCubes, samplerLinear, reflect(toSurface, normal), slot, material.params.y).rgb;
  }

  var out: FragmentOutput;
  out.color = vec4f(color, 1.0);
  return out;
}
${COMMON_WGSL}
`
