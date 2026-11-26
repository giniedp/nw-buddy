export default /* wgsl */ `

struct VSOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vertexIndex : u32) -> VSOutput {
  var pos = vec2<f32>(
    select(-1.0, 3.0, vertexIndex == 2u),
    select(-1.0, 3.0, vertexIndex == 1u)
  );

  var out : VSOutput;
  out.position = vec4<f32>(pos, 0.0, 1.0);
  out.uv = pos * 0.5 + vec2<f32>(0.5);
  out.uv.y = 1.0 - out.uv.y; // flip uv for render target
  return out;
}

@group(1) @binding(0) var tileSampler    : sampler;
@group(1) @binding(1) var tile1Map : texture_2d<f32>;
@group(1) @binding(2) var tile2Map : texture_2d<f32>;
@group(1) @binding(3) var tile3Map : texture_2d<f32>;

struct FSOutput {
  @location(0) map1 : vec4<f32>,
  @location(1) map2 : vec4<f32>,
};


@fragment
fn fs(in: VSOutput) -> FSOutput {

  var sample1 : vec3<f32> = textureSample(tile1Map, tileSampler, in.uv).rgb;
  var sample2 : vec3<f32> = textureSample(tile2Map, tileSampler, in.uv).rgb;
  var sample3 : vec3<f32> = textureSample(tile3Map, tileSampler, in.uv).rgb;

  var out : FSOutput;
  out.map1 = vec4<f32>(sample1.rgb, sample3.x);
  out.map2 = vec4<f32>(sample2.rgb, sample3.y);

  return out;
}
`
