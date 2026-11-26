/**
 * Screen space reflection functions shared by the SsrPass (GBuffer surfaces, graphics/passes/ssr) and the water
 * materials (%SSREFL): the Hi-Z traversal and the cone traced color lookup (Uludag, "Hi-Z Screen-Space Cone-Traced
 * Reflections", GPU Pro 5).
 *
 * The includer defines `fn ssrMinDepth(cell: vec2i, level: i32) -> f32`: the closest linear depth of a cell of a
 * Hi-Z level, level 0 is the linear depth itself (pixels), level L the Hi-Z texture mip L - 1.
 */
export const SSR_SHARED_WGSL = /* wgsl */ `
const SSR_FAR_T: f32 = 1e9;
const SSR_MAX_CONE_SAMPLES: i32 = 7;

struct SsrTraceResult {
  hit : bool,
  // ray parameter of the hit, 0..1 along the full ray
  t   : f32,
  // screen position of the hit: pixels (xy), 1 / linear depth (z)
  pos : vec3f,
};

// t range of a screen space ray (pixels, from s0 along d) inside the screen: x = start one pixel along, y = end
fn ssrRayRange(s0: vec3f, d: vec3f, size: vec2f) -> vec2f {
  var tMax = 1.0;
  if (d.x > 0.0) { tMax = min(tMax, (size.x - 0.5 - s0.x) / d.x); }
  if (d.x < 0.0) { tMax = min(tMax, (0.5 - s0.x) / d.x); }
  if (d.y > 0.0) { tMax = min(tMax, (size.y - 0.5 - s0.y) / d.y); }
  if (d.y < 0.0) { tMax = min(tMax, (0.5 - s0.y) / d.y); }
  let pixels = max(abs(d.x), abs(d.y));
  return vec2f(min(1.0 / max(pixels, 1e-4), tMax), tMax);
}

// Hi-Z traversal of a screen space ray (x, y in pixels, z = 1 / linear depth, linear along the ray):
// in front of a cell's closest surface the ray jumps to that depth plane or the cell exit and climbs a level, behind it
// it descends; at level 0 a crossing is a hit, a ray that went behind a surface hits when within the thickness
// (max(minThickness, depth × thickness)) and marches on otherwise
fn ssrTraceHiZ(
  s0: vec3f,
  d: vec3f,
  tRange: vec2f,
  maxLevel: i32,
  maxIterations: i32,
  thickness: f32,
  minThickness: f32,
) -> SsrTraceResult {
  var result: SsrTraceResult;
  result.hit = false;
  let stepDir = sign(d.xy);
  let boundaryOffset = select(vec2f(0.0), vec2f(1.0), d.xy > vec2f(0.0));
  var t = tRange.x;
  var level = 0;
  for (var i = 0; i < maxIterations; i++) {
    if (t >= tRange.y) {
      break;
    }
    let pos = s0 + d * t;
    let cellSize = f32(1 << u32(level));
    let cell = floor(pos.xy / cellSize);
    let minZ = ssrMinDepth(vec2i(cell), level);
    let invMinZ = 1.0 / max(minZ, 1e-4);

    // t where the ray leaves the cell, nudged across the boundary
    let boundary = (cell + boundaryOffset) * cellSize + stepDir * 0.01;
    let tCellXY = select(vec2f(SSR_FAR_T), (boundary - s0.xy) / d.xy, d.xy != vec2f(0.0));
    let tCell = min(tCellXY.x, tCellXY.y);

    if (pos.z > invMinZ) {
      // in front of the closest surface of the cell: t where the ray reaches its depth (only moving away)
      let tDepth = select(SSR_FAR_T, (invMinZ - s0.z) / d.z, d.z < 0.0);
      if (tDepth < tCell) {
        if (level == 0) {
          result.hit = true;
          result.t = tDepth;
          result.pos = s0 + d * tDepth;
          return result;
        }
        t = max(t, tDepth);
        level -= 1;
      } else {
        t = tCell;
        level = min(level + 1, maxLevel);
      }
    } else if (level > 0) {
      // behind a surface somewhere in the cell: look closer
      level -= 1;
    } else {
      // behind the surface of this pixel: a hit within the thickness, else the ray passes behind it
      let rayZ = 1.0 / pos.z;
      if (rayZ - minZ < max(minThickness, minZ * thickness)) {
        result.hit = true;
        result.t = t;
        result.pos = pos;
        return result;
      }
      t = tCell;
    }
  }
  return result;
}

// fade toward the screen border of a texture coordinate (the game's SSR: sqrt falloff within borderSize), 0 outside
fn ssrBorderFade(uv: vec2f, borderSize: f32) -> f32 {
  let border = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
  if (border <= 0.0) {
    return 0.0;
  }
  return select(sqrt(border / borderSize), 1.0, border > borderSize);
}

// radius of the circle inscribed in an isosceles triangle with the given base and height
fn ssrIncircleRadius(base: f32, height: f32) -> f32 {
  let b2 = base * base;
  return base * (sqrt(b2 + 4.0 * height * height) - base) / (4.0 * height);
}

// Cone traced color lookup: circles inscribed in the reflection cone from the hit back toward the ray origin, each
// sampled from the color pyramid mip of its diameter, accumulated with the gloss as weight until the weights sum to 1.
// The cone half angle is the half energy angle of the GGX lobe, tan = alpha = (1 - smoothness)². A mirror takes one
// sample at mip 0. Origin and hit in pixels of the color texture.
fn ssrConeTrace(
  colorMap: texture_2d<f32>,
  colorSampler: sampler,
  originPx: vec2f,
  hitPx: vec2f,
  smoothness: f32,
  size: vec2f,
) -> vec3f {
  let roughness = 1.0 - smoothness;
  let alpha = roughness * roughness;
  let delta = hitPx - originPx;
  var adjacent = length(delta);
  if (adjacent < 1.0 || alpha < 1e-3) {
    return textureSampleLevel(colorMap, colorSampler, hitPx / size, 0.0).rgb;
  }
  let direction = delta / adjacent;
  let maxMip = f32(textureNumLevels(colorMap) - 1u);
  let weight = max(smoothness, 0.1);
  var color = vec3f(0.0);
  var total = 0.0;
  for (var i = 0; i < SSR_MAX_CONE_SAMPLES; i++) {
    let opposite = 2.0 * alpha * adjacent;
    let radius = ssrIncircleRadius(opposite, adjacent);
    let samplePx = originPx + direction * (adjacent - radius);
    let mip = clamp(log2(max(radius * 2.0, 1.0)), 0.0, maxMip);
    let tap = textureSampleLevel(colorMap, colorSampler, samplePx / size, mip).rgb;
    let w = min(weight, 1.0 - total);
    color += tap * w;
    total += w;
    if (total >= 0.999) {
      break;
    }
    adjacent -= 2.0 * radius;
    if (adjacent < 1.0) {
      break;
    }
  }
  return color / max(total, 1e-4);
}
`

/**
 * Screen space reflections in forward materials (water %SSREFL), from the SsrPass pyramids of this frame
 * (`view.hiZMap`, the opaque scene) and the previous frame color (`view.previousSceneColorMap`), gated by `view.ssr.x`.
 *
 * The material declares `view` (ViewBlock), `sceneDepthMap` (linear depth) and both maps in the view block.
 * Thickness and border fade are the SsrPass defaults.
 */
export const SSR_MATERIAL_WGSL = /* wgsl */ `
fn ssrMinDepth(cell: vec2i, level: i32) -> f32 {
  if (level == 0) {
    let depth = textureLoad(sceneDepthMap, cell, 0).r;
    return select(depth, view.far, depth <= 0.0);
  }
  return textureLoad(hiZMap, cell, level - 1).r;
}

${SSR_SHARED_WGSL}

const SSR_MATERIAL_THICKNESS: f32 = 0.03;
const SSR_MATERIAL_MIN_THICKNESS: f32 = 0.15;
const SSR_MATERIAL_BORDER_FADE: f32 = 0.07;

// world position of a pixel center at a linear view depth (reversed z: ndc z 0 is the far plane)
fn ssrMaterialWorldPos(px: vec2f, depth: f32, size: vec2f) -> vec3f {
  let uv = px / size;
  let h = view.inverseViewProjectionMatrix * vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  return view.cameraPosition + (h.xyz / h.w - view.cameraPosition) * (depth / view.far);
}

// texture coordinate of a world position in the previous frame, z <= 0 behind its camera
fn ssrMaterialPreviousUv(world: vec3f) -> vec3f {
  let prev = view.previousViewProjectionMatrix * vec4f(world, 1.0);
  return vec3f(prev.x / prev.w * 0.5 + 0.5, 0.5 - prev.y / prev.w * 0.5, prev.w);
}

// Traces a reflected ray from a world position. Returns the previous frame uv of the hit (xy) and the confidence (z),
// 0 on a miss, on the sky or without valid pyramids. The game's fades: rays toward the camera, screen border, ray end.
fn ssrMaterialTrace(origin: vec3f, reflDir: vec3f) -> vec3f {
  if (view.ssr.x < 0.5) {
    return vec3f(0.0);
  }
  let viewDir = normalize(origin - view.cameraPosition);
  let dirAtten = saturate(dot(viewDir, reflDir) + 0.5);
  if (dirAtten < 0.01) {
    return vec3f(0.0);
  }
  let size = vec2f(textureDimensions(sceneDepthMap, 0));
  let viewProj = view.projectionMatrix * view.viewMatrix;

  // ray end: max length, kept in front of the near plane
  let depth0 = dot(origin - view.cameraPosition, view.cameraDirection);
  var rayLength = view.ssr.z;
  let towardCamera = dot(reflDir, view.cameraDirection);
  if (towardCamera < 0.0) {
    rayLength = min(rayLength, (depth0 - view.near * 2.0) / -towardCamera);
  }
  let c0 = viewProj * vec4f(origin, 1.0);
  let c1 = viewProj * vec4f(origin + reflDir * rayLength, 1.0);
  let s0 = vec3f((c0.x / c0.w * 0.5 + 0.5) * size.x, (0.5 - c0.y / c0.w * 0.5) * size.y, 1.0 / c0.w);
  let s1 = vec3f((c1.x / c1.w * 0.5 + 0.5) * size.x, (0.5 - c1.y / c1.w * 0.5) * size.y, 1.0 / c1.w);
  let d = s1 - s0;

  let trace = ssrTraceHiZ(
    s0,
    d,
    ssrRayRange(s0, d, size),
    i32(view.ssr.y),
    i32(view.ssr.w),
    SSR_MATERIAL_THICKNESS,
    SSR_MATERIAL_MIN_THICKNESS,
  );
  if (!trace.hit) {
    return vec3f(0.0);
  }
  let hitPixel = clamp(vec2i(trace.pos.xy), vec2i(0), vec2i(size) - 1);
  let hitDepth = textureLoad(sceneDepthMap, hitPixel, 0).r;
  // the sky is not a hit, the env reflection shows it
  if (hitDepth <= 0.0 || hitDepth >= view.far * 0.999) {
    return vec3f(0.0);
  }
  let prev = ssrMaterialPreviousUv(ssrMaterialWorldPos(vec2f(hitPixel) + 0.5, hitDepth, size));
  let edge = ssrBorderFade(prev.xy, SSR_MATERIAL_BORDER_FADE);
  if (prev.z <= 0.0 || edge <= 0.0) {
    return vec3f(0.0);
  }
  let endFade = 1.0 - smoothstep(0.8, 1.0, trace.t);
  return vec3f(prev.xy, edge * dirAtten * endFade);
}

// ssrMaterialTrace for water surfaces (ReflectionPassPS, waterreflectionspass.cfi): no reflections while the camera
// looks down at the water, 0.6 found experimentally by the game (1 - step(0.6, dot(-camForward, normal)))
fn ssrWaterTrace(origin: vec3f, reflDir: vec3f, normal: vec3f) -> vec3f {
  let facingWater = saturate(dot(-view.cameraDirection, normal));
  if (facingWater >= 0.6) {
    return vec3f(0.0);
  }
  return ssrMaterialTrace(origin, reflDir);
}

// Cone traced color of a hit from ssrMaterialTrace, the lookup moved by offsetUv (e.g. a bump distortion)
fn ssrMaterialColor(origin: vec3f, hit: vec3f, smoothness: f32, offsetUv: vec2f, colorSampler: sampler) -> vec3f {
  let size = vec2f(textureDimensions(previousSceneColorMap, 0));
  let originPrev = ssrMaterialPreviousUv(origin);
  return ssrConeTrace(
    previousSceneColorMap,
    colorSampler,
    originPrev.xy * size,
    (hit.xy + offsetUv) * size,
    smoothness,
    size,
  );
}
`
