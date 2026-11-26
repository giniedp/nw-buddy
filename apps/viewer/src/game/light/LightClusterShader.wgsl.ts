export const LIGHT_CLUSTER_WORKGROUP_SIZE = 64

/**
 * Compute shader that assigns lights to a view space 3d cluster grid (Forward+).
 *
 * @remarks
 * One invocation per cluster. Each cluster computes its view space AABB from the
 * screen tile and an exponential depth slice, then tests all light bounding spheres.
 * Visible light indices are appended to a global index list using an atomic counter.
 * No depth pre pass is used, so every cluster in the frustum is populated.
 */
export const LIGHT_CLUSTER_WGSL = /* wgsl */ `


override WORKGROUP_SIZE: u32 = 64;

// sizes a function scope array, which does not allow override constants
const MAX_LIGHTS_PER_CLUSTER: u32 = 128u;

struct Params {
  viewMatrix: mat4x4f,
  projection: vec4f,
  grid      : vec4u,
  depth     : vec4f,
};

struct Light {
  position : vec4f,
  color    : vec4f,
  direction: vec4f,
  tangent  : vec4f,
  params   : vec4f,
  bounds   : vec4f,
};

struct LightCluster {
  offset: u32,
  count : u32,
};


@group(0) @binding(0) var<uniform>             params  : Params;
// @vite skip
@group(0) @binding(1) var<storage, read>       lights  : array<Light>;
// @vite skip
@group(0) @binding(2) var<storage, read_write> clusters: array<LightCluster>;
// @vite skip
@group(0) @binding(3) var<storage, read_write> indices : array<u32>;
// @vite skip
@group(0) @binding(4) var<storage, read_write> counter : atomic<u32>;

// view space depth (positive distance) at the given slice boundary
fn sliceDepth(slice: u32) -> f32 {
  if (slice == 0u) {
    return 0.0;
  }
  let near = params.depth.x;
  let far = params.depth.y;
  return near * pow(far / near, f32(slice) / f32(params.grid.z));
}

fn sphereIntersectsAabb(center: vec3f, radius: f32, aabbMin: vec3f, aabbMax: vec3f) -> bool {
  let closest = clamp(center, aabbMin, aabbMax);
  let d = closest - center;
  return dot(d, d) <= radius * radius;
}

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let grid = params.grid.xyz;
  let clusterCount = grid.x * grid.y * grid.z;
  let index = id.x;
  if (index >= clusterCount) {
    return;
  }

  let tx = index % grid.x;
  let ty = (index / grid.x) % grid.y;
  let tz = index / (grid.x * grid.y);

  // tile bounds in NDC
  let ndcMin = vec2f(f32(tx), f32(ty)) / vec2f(grid.xy) * 2.0 - 1.0;
  let ndcMax = vec2f(f32(tx + 1u), f32(ty + 1u)) / vec2f(grid.xy) * 2.0 - 1.0;

  // depth slice bounds (positive view distance)
  let dNear = sliceDepth(tz);
  let dFar = sliceDepth(tz + 1u);

  // view space AABB of the cluster frustum segment (view space looks down -Z)
  // ndc.x = (P00 * x + P20 * z) / -z  =>  x = (ndc.x + P20) * d / P00  with d = -z
  let p = params.projection;
  let x0 = (ndcMin.x + p.z) / p.x;
  let x1 = (ndcMax.x + p.z) / p.x;
  let y0 = (ndcMin.y + p.w) / p.y;
  let y1 = (ndcMax.y + p.w) / p.y;
  let aabbMin = vec3f(
    min(min(x0 * dNear, x0 * dFar), min(x1 * dNear, x1 * dFar)),
    min(min(y0 * dNear, y0 * dFar), min(y1 * dNear, y1 * dFar)),
    -dFar,
  );
  let aabbMax = vec3f(
    max(max(x0 * dNear, x0 * dFar), max(x1 * dNear, x1 * dFar)),
    max(max(y0 * dNear, y0 * dFar), max(y1 * dNear, y1 * dFar)),
    -dNear,
  );

  var local: array<u32, MAX_LIGHTS_PER_CLUSTER>;
  var count = 0u;
  let lightCount = params.grid.w;
  for (var i = 0u; i < lightCount; i++) {
    let bounds = lights[i].bounds;
    let center = (params.viewMatrix * vec4f(bounds.xyz, 1.0)).xyz;
    if (sphereIntersectsAabb(center, bounds.w, aabbMin, aabbMax)) {
      local[count] = i;
      count++;
      if (count >= MAX_LIGHTS_PER_CLUSTER) {
        break;
      }
    }
  }

  var offset = 0u;
  if (count > 0u) {
    offset = atomicAdd(&counter, count);
    let maxIndices = params.depth.z;
    let capacity = u32(max(0.0, maxIndices - f32(offset)));
    count = min(count, capacity);
    for (var i = 0u; i < count; i++) {
      indices[offset + i] = local[i];
    }
  }
  clusters[index].offset = offset;
  clusters[index].count = count;
}
`
