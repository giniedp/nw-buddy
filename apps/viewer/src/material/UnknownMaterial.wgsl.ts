import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

struct MaterialBlock {
  color:     vec4f,
};

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
  let modelMatrix = object[input.id].modelMatrix;

  let worldPos = modelMatrix * vec4f(input.position, 1.0);
  let viewPos  = view.viewMatrix * worldPos;
  let clipPos  = view.projectionMatrix * viewPos;

  var output: FragmentInput;
  output.Position = clipPos;
  output.color = material.color;

  return output;
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  var out: FragmentOutput;
  out.color = vec4f(1.0, 0.0, 0.0, 1.0);
  return out;
}
${COMMON_WGSL}
`
