export const GPU_INSTANCE_CULL_SHADER = /* wgsl */ `
// GPU instance culling
//
// Records are unordered and may be free. Each visible record is assigned a slot inside its group,
// group output ranges are computed with a prefix sum over the visible counts.
//
// reset    - one thread per group, clears the visible counters
// cull     - one thread per record, counts visible records per group and remembers the slot
// scan     - single workgroup, exclusive prefix sum of the counters into offsets
// scatter  - one thread per record, writes visible world transforms to their final output position
// finalize - one thread per draw, writes instance count and first instance into the indirect arguments

const INVALID = 0xFFFFFFFFu;
const SCAN_SIZE = 256u;

struct Params {
  planes : array<vec4f, 6>, // frustum planes, normals point outwards
  camera : vec4f,           // xyz = camera position, w = view distance scale (0 = ignore view distance)
  counts : vec4u,           // x = record capacity, y = groups, z = draws
};

struct Record {
  world : mat4x4f,
  info  : vec4u, // x = group (INVALID if free), y = max view distance (f32 bits, 0 = unlimited)
};

@group(0) @binding(0) var<uniform>             params   : Params;
@group(0) @binding(1) var<storage, read>       records  : array<Record>;
@group(0) @binding(2) var<storage, read>       groups   : array<vec4f>; // bounding sphere in record space
@group(0) @binding(3) var<storage, read_write> output   : array<mat4x4f>;
@group(0) @binding(4) var<storage, read_write> counters : array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> offsets  : array<u32>;
@group(0) @binding(6) var<storage, read_write> slots    : array<u32>;
@group(0) @binding(7) var<storage, read>       draws    : array<vec2u>; // x = group, y = word index of first instance in args
@group(0) @binding(8) var<storage, read_write> args     : array<u32>;   // 5 words per draw

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
  slots[index] = INVALID;

  let record = records[index];
  let group = record.info.x;
  if (group == INVALID) {
    return;
  }

  let sphere = groups[group];
  let world = record.world;
  let center = (world * vec4f(sphere.xyz, 1.0)).xyz;
  let scale = max(length(world[0].xyz), max(length(world[1].xyz), length(world[2].xyz)));
  let radius = sphere.w * scale;

  let maxDistance = bitcast<f32>(record.info.y) * params.camera.w;
  if (maxDistance > 0.0 && distance(params.camera.xyz, center) - radius > maxDistance) {
    return;
  }

  for (var i = 0u; i < 6u; i++) {
    let plane = params.planes[i];
    if (dot(plane.xyz, center) + plane.w > radius) {
      return;
    }
  }

  slots[index] = atomicAdd(&counters[group], 1u);
}

var<workgroup> partial : array<u32, SCAN_SIZE>;

@compute @workgroup_size(SCAN_SIZE)
fn scan(@builtin(local_invocation_index) lid: u32) {
  let count = params.counts.y;
  let chunk = (count + SCAN_SIZE - 1u) / SCAN_SIZE;
  let start = lid * chunk;
  let end = min(start + chunk, count);

  var sum = 0u;
  for (var i = start; i < end; i++) {
    sum += atomicLoad(&counters[i]);
  }
  partial[lid] = sum;
  workgroupBarrier();

  if (lid == 0u) {
    var acc = 0u;
    for (var i = 0u; i < SCAN_SIZE; i++) {
      let value = partial[i];
      partial[i] = acc;
      acc += value;
    }
  }
  workgroupBarrier();

  var offset = partial[lid];
  for (var i = start; i < end; i++) {
    offsets[i] = offset;
    offset += atomicLoad(&counters[i]);
  }
}

@compute @workgroup_size(64)
fn scatter(@builtin(global_invocation_id) id: vec3u) {
  let index = id.x;
  if (index >= params.counts.x) {
    return;
  }
  let slot = slots[index];
  if (slot == INVALID) {
    return;
  }
  let record = records[index];
  output[offsets[record.info.x] + slot] = record.world;
}

@compute @workgroup_size(64)
fn finalize(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= params.counts.z) {
    return;
  }
  let draw = draws[id.x];
  args[id.x * 5u + 1u] = atomicLoad(&counters[draw.x]);
  args[draw.y] = offsets[draw.x];
}
`
