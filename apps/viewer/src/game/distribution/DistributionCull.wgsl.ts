export const DISTRIBUTION_CULL_SHADER = /* wgsl */ `
// Distribution culling
//
// Each record is one mesh of one distribution instance. Records are sorted by group (model + material),
// so each group owns a contiguous range in the output buffer starting at group.info.y.
//
// reset    - one thread per group, clears the visible counters
// cull     - one thread per record, writes visible world transforms compacted per group
// finalize - one thread per draw, copies the group counter into the indirect draw arguments

struct Params {
  planes : array<vec4f, 6>, // frustum planes, normals point outwards
  camera : vec4f,           // xyz = camera position, w = view distance scale (0 = ignore view distance)
  region : vec4f,           // xy = region origin, z = cell size, w = visible distance to cell
  counts : vec4u,           // x = records, y = groups, z = draws, w = cells per axis
};

struct Group {
  node   : mat4x4f, // transform of the mesh node inside the model
  sphere : vec4f,   // bounding sphere in model space
  info   : vec4u,   // x = enabled, y = output offset
};

@group(0) @binding(0) var<uniform>             params     : Params;
@group(0) @binding(1) var<storage, read>       records    : array<mat4x4f>;
@group(0) @binding(2) var<storage, read>       recordInfo : array<vec2u>; // x = group | cell << 16, y = max view distance (f32 bits)
@group(0) @binding(3) var<storage, read>       groups     : array<Group>;
@group(0) @binding(4) var<storage, read_write> output     : array<mat4x4f>;
@group(0) @binding(5) var<storage, read_write> counters   : array<atomic<u32>>;
@group(0) @binding(6) var<storage, read>       draws      : array<u32>; // group index per draw
@group(0) @binding(7) var<storage, read_write> args       : array<u32>; // 5 values per draw

@compute @workgroup_size(64)
fn reset(@builtin(global_invocation_id) id: vec3u) {
  if (id.x < params.counts.y) {
    atomicStore(&counters[id.x], 0u);
  }
}

@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id: vec3u) {
  let index = id.x;
  if (index >= params.counts.x) {
    return;
  }

  let info = recordInfo[index];
  let groupIndex = info.x & 0xFFFFu;
  let group = groups[groupIndex];
  if (group.info.x == 0u) {
    return;
  }

  // hand over to impostors with the same rule as the impostor cells: distance from camera to the cell rectangle
  let cellsPerAxis = params.counts.w;
  let cell = info.x >> 16u;
  let cellMin = params.region.xy + vec2f(f32(cell % cellsPerAxis), f32(cell / cellsPerAxis)) * params.region.z;
  let nearest = clamp(params.camera.xy, cellMin, cellMin + vec2f(params.region.z));
  if (distance(params.camera.xy, nearest) > params.region.w) {
    return;
  }

  let world = records[index] * group.node;
  let center = (world * vec4f(group.sphere.xyz, 1.0)).xyz;
  let scale = max(length(world[0].xyz), max(length(world[1].xyz), length(world[2].xyz)));
  let radius = group.sphere.w * scale;

  let maxDistance = bitcast<f32>(info.y) * params.camera.w;
  if (maxDistance > 0.0 && distance(params.camera.xyz, center) - radius > maxDistance) {
    return;
  }

  for (var i = 0u; i < 6u; i++) {
    let plane = params.planes[i];
    if (dot(plane.xyz, center) + plane.w > radius) {
      return;
    }
  }

  let slot = atomicAdd(&counters[groupIndex], 1u);
  output[group.info.y + slot] = world;
}

@compute @workgroup_size(64)
fn finalize(@builtin(global_invocation_id) id: vec3u) {
  if (id.x < params.counts.z) {
    args[id.x * 5u + 1u] = atomicLoad(&counters[draws[id.x]]);
  }
}
`
