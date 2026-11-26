import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct InstanceBlock {
  transform: mat4x4f,
  color:     vec4f,
};

// @private
@group(0) @binding(0) var<uniform> global: GlobalBlock;
// @private
@group(0) @binding(1) var<uniform> view: ViewBlock;

@group(0) @binding(2) var<uniform> object: ObjectBlock;
@group(0) @binding(3) var<storage, read> instances: array<InstanceBlock>;

struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3<f32>,
};

struct FragmentInput {
  @builtin(position) Position: vec4<f32>,
  @location(0)       color:    vec4<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let instance = instances[input.id];

  var output: FragmentInput;
  var localPos = instance.transform    * vec4f(input.position, 1.0);
  let worldPos = object.modelMatrix    * localPos;
  let viewPos  = view.viewMatrix       * worldPos;
  let clipPos  = view.projectionMatrix * viewPos;

  output.Position = clipPos;
  output.color = instance.color;

  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  var out: FragmentOutput;
  out.color = input.color;
  return out;
}
${COMMON_WGSL}
`
