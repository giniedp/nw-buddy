export const VEGETATION_CULL_SHADER = /* wgsl */ `
// Vegetation culling
//
// The instance buffer is divided into slots of maxInstancesPerCell instances, each slot holds one loaded cell.
// Instances are packed as in the region.vegetation file (see writeVegetationCell).
// Each group (asset) owns a contiguous range in the output buffer starting at group.info.y.
//
// reset    - one thread per group, clears the visible counters
// cull     - one thread per instance slot entry, writes visible world transforms compacted per group
// finalize - one thread per draw, copies the group counter into the indirect draw arguments

struct Params {
  planes : array<vec4f, 6>, // frustum planes, normals point outwards
  camera : vec4f,           // xyz = camera position, w = visible distance
  region : vec4f,           // xy = region origin, z = region size
  counts : vec4u,           // x = threads, y = groups, z = draws, w = max instances per cell (slot size)
};

struct Group {
  node   : mat4x4f, // transform of the mesh node inside the model
  sphere : vec4f,   // bounding sphere in model space
  info   : vec4u,   // x = enabled, y = output offset
};

@group(0) @binding(0) var<uniform>             params    : Params;
@group(0) @binding(1) var<storage, read>       instances : array<vec4u>;
@group(0) @binding(2) var<storage, read>       slots     : array<vec4u>; // x = instance count
@group(0) @binding(3) var<storage, read>       groups    : array<Group>;
@group(0) @binding(4) var<storage, read_write> output    : array<mat4x4f>;
@group(0) @binding(5) var<storage, read_write> counters  : array<atomic<u32>>;
@group(0) @binding(6) var<storage, read>       draws     : array<u32>; // group index per draw
@group(0) @binding(7) var<storage, read_write> args      : array<u32>; // 5 values per draw

@compute @workgroup_size(64)
fn reset(@builtin(global_invocation_id) id: vec3u) {
  if (id.x < params.counts.y) {
    atomicStore(&counters[id.x], 0u);
  }
}

fn decodeRotation(bits: u32) -> vec4f {
  let x = (f32((bits >> 21u) & 0x3FFu) - 255.5) / 255.0;
  let y = (f32((bits >> 11u) & 0x3FFu) - 255.5) / 255.0;
  let z = (f32(bits & 0x3FFu) - 511.5) / 511.0;
  var w = sqrt(max(0.0, 1.0 - (x * x + y * y + z * z)));
  if ((bits & 0x80000000u) != 0u) {
    w = -w;
  }
  return normalize(vec4f(x, y, z, w));
}

@compute @workgroup_size(64)
fn cull(@builtin(global_invocation_id) id: vec3u) {
  let index = id.x;
  if (index >= params.counts.x) {
    return;
  }
  let slotSize = params.counts.w;
  if (index % slotSize >= slots[index / slotSize].x) {
    return;
  }

  let instance = instances[index];
  let groupIndex = instance.w;
  let group = groups[groupIndex];
  if (group.info.x == 0u) {
    return;
  }

  let q = decodeRotation(instance.x);
  let position = vec3f(
    params.region.xy + vec2f(f32(instance.y & 0xFFFFu), f32(instance.y >> 16u)) * (params.region.z / 65535.0),
    f32(instance.z & 0xFFFFu) / 31.999512,
  );
  let scale = f32((instance.z >> 16u) & 0xFFu) / 100.0;

  let xx = q.x * q.x; let yy = q.y * q.y; let zz = q.z * q.z;
  let xy = q.x * q.y; let xz = q.x * q.z; let yz = q.y * q.z;
  let wx = q.w * q.x; let wy = q.w * q.y; let wz = q.w * q.z;
  let instanceWorld = mat4x4f(
    vec4f(1.0 - 2.0 * (yy + zz), 2.0 * (xy + wz), 2.0 * (xz - wy), 0.0) * scale,
    vec4f(2.0 * (xy - wz), 1.0 - 2.0 * (xx + zz), 2.0 * (yz + wx), 0.0) * scale,
    vec4f(2.0 * (xz + wy), 2.0 * (yz - wx), 1.0 - 2.0 * (xx + yy), 0.0) * scale,
    vec4f(position, 1.0),
  );

  let world = instanceWorld * group.node;
  let center = (world * vec4f(group.sphere.xyz, 1.0)).xyz;
  let radius = group.sphere.w * scale * max(length(group.node[0].xyz), max(length(group.node[1].xyz), length(group.node[2].xyz)));

  if (distance(params.camera.xyz, center) - radius > params.camera.w) {
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
