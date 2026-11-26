import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { SSR_SHARED_WGSL } from '../../../material/ssr.wgsl'

export const PYRAMID_WORKGROUP_SIZE = 8

/**
 * Hi-Z level N from level N-1 (level 0 is the linear depth itself, the Hi-Z texture holds levels 1..): the minimum
 * (closest) depth of the covered texels. A texel of an odd sized source that has no partner is folded into the last
 * row / column, so every source texel is covered (conservative for the march).
 */
export const HIZ_DOWNSAMPLE_WGSL = /* wgsl */ `
// @unfilterable
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var destination: texture_storage_2d<r32float, write>;

@compute @workgroup_size(${PYRAMID_WORKGROUP_SIZE}, ${PYRAMID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let targetSize = textureDimensions(destination);
  if (id.x >= targetSize.x || id.y >= targetSize.y) {
    return;
  }
  let size = vec2i(textureDimensions(source));
  let last = size - 1;
  let p = vec2i(id.xy) * 2;
  let p1 = min(p + 1, last);
  var d = min(
    min(textureLoad(source, p, 0).r, textureLoad(source, vec2i(p1.x, p.y), 0).r),
    min(textureLoad(source, vec2i(p.x, p1.y), 0).r, textureLoad(source, p1, 0).r),
  );
  let extraX = (size.x & 1) == 1 && p.x + 2 == last.x;
  let extraY = (size.y & 1) == 1 && p.y + 2 == last.y;
  if (extraX) {
    d = min(d, min(textureLoad(source, vec2i(last.x, p.y), 0).r, textureLoad(source, vec2i(last.x, p1.y), 0).r));
  }
  if (extraY) {
    d = min(d, min(textureLoad(source, vec2i(p.x, last.y), 0).r, textureLoad(source, vec2i(p1.x, last.y), 0).r));
  }
  if (extraX && extraY) {
    d = min(d, textureLoad(source, last, 0).r);
  }
  textureStore(destination, vec2i(id.xy), vec4f(d, 0.0, 0.0, 1.0));
}
`

export const SSR_WORKGROUP_SIZE = 8

/**
 * Hi-Z screen space reflection trace (Uludag, "Hi-Z Screen-Space Cone-Traced Reflections", GPU Pro 5), one pixel per
 * invocation, in the frame structure of the game's SSR_Raytrace (deferredshading.cfx):
 * - the mirror ray from the GBuffer normal is traced in screen space as (x, y, 1/depth), linear along the ray
 * - min depth pyramid traversal: in front of a cell's closest surface the ray jumps to that depth plane or the cell
 *   exit and climbs a level, behind it it descends; at mip 0 a crossing is a hit, a ray that went behind a surface
 *   hits when within the thickness and marches on otherwise
 * - the hit is reprojected into the previous frame (previousViewProjectionMatrix), like the game (g_mViewProjPrev)
 * - confidence: the game's fades (screen border on the reprojected position, rays toward the camera
 *   `saturate(dot(view, refl) + 0.5)`) plus a fade at the end of the ray, 0 on a miss or a back face hit
 *
 * Output per pixel: previous frame uv of the hit (xy), confidence (z). The color comes from {@link SSR_RESOLVE_WGSL}.
 */
const SSR_COMMON_WGSL = /* wgsl */ `
struct SsrParams {
  viewProj     : mat4x4f,
  invViewProj  : mat4x4f,
  prevViewProj : mat4x4f,
  // xyz = camera position, w = near
  camera       : vec4f,
  // xyz = camera forward, w = far
  forward      : vec4f,
  // x = max ray length (m), y = thickness relative to the depth, z = max iterations, w = min smoothness
  trace        : vec4f,
  // x = Hi-Z mip count, y = max hit luminance relative to the average luminance (0 = no clamp),
  // z = border fade size, w = min thickness (m)
  extra        : vec4f,
};

@group(0) @binding(0) var<uniform> ssr        : SsrParams;

// world position at a texture coordinate and linear view depth (reversed z: ndc z 0 is the far plane)
fn worldPosAt(uv: vec2f, depth: f32) -> vec3f {
  let h = ssr.invViewProj * vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
  let farPos = h.xyz / h.w;
  return ssr.camera.xyz + (farPos - ssr.camera.xyz) * (depth / ssr.forward.w);
}

// screen position in pixels (xy) and 1 / linear depth (z)
fn toScreen(world: vec3f, size: vec2f) -> vec3f {
  let c = ssr.viewProj * vec4f(world, 1.0);
  let invW = 1.0 / c.w;
  let ndc = c.xy * invW;
  return vec3f((ndc.x * 0.5 + 0.5) * size.x, (0.5 - ndc.y * 0.5) * size.y, invW);
}

// texture coordinate of a world position in the previous frame, w <= 0 behind its camera
fn toPreviousUv(world: vec3f) -> vec3f {
  let prev = ssr.prevViewProj * vec4f(world, 1.0);
  return vec3f(prev.x / prev.w * 0.5 + 0.5, 0.5 - prev.y / prev.w * 0.5, prev.w);
}
`

export const SSR_TRACE_WGSL = /* wgsl */ `
${SSR_COMMON_WGSL}

@group(0) @binding(1) var gbufferA            : texture_2d<f32>;
@group(0) @binding(2) var gbufferC            : texture_2d<f32>;
// Hi-Z levels 1.. (mip 0 is half the screen), level 0 is the linear depth
// @unfilterable
@group(0) @binding(3) var hiZ                 : texture_2d<f32>;
// @unfilterable
@group(0) @binding(4) var linearDepth         : texture_2d<f32>;
// x y = previous frame uv of the hit, z = confidence
@group(0) @binding(5) var outHits             : texture_storage_2d<rgba32float, write>;

fn decodeNormal(a: vec4f) -> vec3f {
  return normalize(a.xyz * 2.0 - 1.0);
}

// closest linear depth of a cell of a Hi-Z level (SSR_SHARED_WGSL)
fn ssrMinDepth(cell: vec2i, level: i32) -> f32 {
  if (level == 0) {
    return textureLoad(linearDepth, cell, 0).r;
  }
  return textureLoad(hiZ, cell, level - 1).r;
}

${SSR_SHARED_WGSL}

@compute @workgroup_size(${SSR_WORKGROUP_SIZE}, ${SSR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let outSize = textureDimensions(outHits);
  if (id.x >= outSize.x || id.y >= outSize.y) {
    return;
  }
  let p = vec2i(id.xy);
  let size = vec2f(outSize);
  let far = ssr.forward.w;
  let depth = textureLoad(linearDepth, p, 0).r;
  if (depth <= 0.0 || depth >= far * 0.999) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }
  let smoothness = textureLoad(gbufferC, p, 0).r;
  if (smoothness < ssr.trace.w) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }
  let normal = decodeNormal(textureLoad(gbufferA, p, 0));
  let uv = (vec2f(p) + 0.5) / size;
  let surface = worldPosAt(uv, depth);
  let viewDir = normalize(surface - ssr.camera.xyz);
  let reflDir = reflect(viewDir, normal);

  // the game fades rays toward the camera (SSRRaytracePS dirAtten)
  let dirAtten = saturate(dot(viewDir, reflDir) + 0.5);
  if (dirAtten < 0.01) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }

  // ray end: max length, kept in front of the near plane
  let origin = surface + normal * (0.01 + depth * 0.001);
  var rayLength = ssr.trace.x;
  let towardCamera = dot(reflDir, ssr.forward.xyz);
  if (towardCamera < 0.0) {
    rayLength = min(rayLength, (depth - ssr.camera.w * 2.0) / -towardCamera);
  }
  let s0 = toScreen(origin, size);
  let s1 = toScreen(origin + reflDir * rayLength, size);
  let d = s1 - s0;

  let trace = ssrTraceHiZ(
    s0,
    d,
    ssrRayRange(s0, d, size),
    i32(ssr.extra.x),
    i32(ssr.trace.z),
    ssr.trace.y,
    ssr.extra.w,
  );
  if (!trace.hit) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }

  let hitPixel = clamp(vec2i(trace.pos.xy), vec2i(0), vec2i(outSize) - 1);
  let hitDepth = textureLoad(linearDepth, hitPixel, 0).r;
  // the sky is not a hit, the probe reflects it
  if (hitDepth >= far * 0.999) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }
  // no reflections of back faces
  let hitNormal = decodeNormal(textureLoad(gbufferA, hitPixel, 0));
  if (dot(hitNormal, reflDir) > 0.0) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }
  let hitWorld = worldPosAt((vec2f(hitPixel) + 0.5) / size, hitDepth);

  // reprojection into the previous frame
  let prev = toPreviousUv(hitWorld);
  let edge = ssrBorderFade(prev.xy, ssr.extra.z);
  if (prev.z <= 0.0 || edge <= 0.0) {
    textureStore(outHits, p, vec4f(0.0));
    return;
  }
  let endFade = 1.0 - smoothstep(0.8, 1.0, trace.t);
  textureStore(outHits, p, vec4f(prev.xy, edge * dirAtten * endFade, 0.0));
}
`

/**
 * Resolve of the traced hits ({@link SSR_TRACE_WGSL}) into the reflection color, a separate pass so the cone sampling
 * does not weigh on the trace (registers, occupancy).
 *
 * Cone tracing (Uludag): circles inscribed in the reflection cone from the hit back toward the ray origin, each sampled
 * from the color pyramid mip of its diameter, accumulated with the gloss as weight until the weights sum to 1. The cone
 * half angle is the half energy angle of the GGX lobe, tan = alpha. A mirror (alpha 0) takes one sample at mip 0. The
 * cone is built in the previous frame: the pixel itself is reprojected like the hit.
 *
 * Then the game's brightness clamp (SSRRaytracePS: 100 × the average luminance), which also keeps reflected highlights
 * from feeding back over frames. Output rgb = color, a = confidence.
 */
export const SSR_RESOLVE_WGSL = /* wgsl */ `
${SSR_COMMON_WGSL}

@group(0) @binding(1) var gbufferC            : texture_2d<f32>;
// @unfilterable
@group(0) @binding(2) var linearDepth         : texture_2d<f32>;
// @unfilterable
@group(0) @binding(3) var hits                : texture_2d<f32>;
@group(0) @binding(4) var previousColor       : texture_2d<f32>;
@group(0) @binding(5) var linearSampler       : sampler;
// 1x1 adapted luminance of the previous frame (LuminancePass, x = luminance)
@group(0) @binding(6) var luminance           : texture_2d<f32>;
@group(0) @binding(7) var outReflection       : texture_storage_2d<rgba16float, write>;

fn ssrMinDepth(cell: vec2i, level: i32) -> f32 {
  return textureLoad(linearDepth, cell, 0).r;
}

${SSR_SHARED_WGSL}

@compute @workgroup_size(${SSR_WORKGROUP_SIZE}, ${SSR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let outSize = textureDimensions(outReflection);
  if (id.x >= outSize.x || id.y >= outSize.y) {
    return;
  }
  let p = vec2i(id.xy);
  let hit = textureLoad(hits, p, 0);
  if (hit.z <= 0.0) {
    textureStore(outReflection, p, vec4f(0.0));
    return;
  }
  let size = vec2f(outSize);
  let depth = textureLoad(linearDepth, p, 0).r;
  let origin = toPreviousUv(worldPosAt((vec2f(p) + 0.5) / size, depth));
  let smoothness = textureLoad(gbufferC, p, 0).r;
  var color = ssrConeTrace(previousColor, linearSampler, origin.xy * size, hit.xy * size, smoothness, size);
  if (ssr.extra.y > 0.0) {
    color = min(color, vec3f(textureLoad(luminance, vec2i(0), 0).x * ssr.extra.y));
  }
  textureStore(outReflection, p, vec4f(select(color, vec3f(0.0), color != color), hit.z));
}
`

export const SsrDebugModes = ['off', 'hiz', 'color'] as const
export type SsrDebugMode = (typeof SsrDebugModes)[number]

/**
 * Debug output of the pyramids into the reflection channel (the LightingPass shows it with its 'reflections' mode):
 * - hiz: the Hi-Z mip as log depth (black near, white at the far plane)
 * - color: the previous frame color mip
 */
export const SSR_DEBUG_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct DebugParams {
  // x = mode (1 hiz, 2 color), y = mip, z = far plane
  values: vec4f,
};
@group(0) @binding(0) var<uniform> params: DebugParams;
// @unfilterable
@group(0) @binding(1) var hiZ: texture_2d<f32>;
@group(0) @binding(2) var colorPyramid: texture_2d<f32>;
@group(0) @binding(3) var linearSampler: sampler;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let mode = u32(params.values.x);
  let mip = params.values.y;
  if (mode == 1u) {
    let size = vec2f(textureDimensions(hiZ, u32(mip)));
    let p = vec2i(in.uv * size);
    let depth = textureLoad(hiZ, p, i32(mip)).r;
    let t = saturate(log2(max(depth, 0.01) + 1.0) / log2(params.values.z + 1.0));
    return vec4f(vec3f(t), 1.0);
  }
  return vec4f(textureSampleLevel(colorPyramid, linearSampler, in.uv, mip).rgb, 1.0);
}
`

/**
 * Previous color mip N from mip N-1: the 13 tap downsample filter (Jimenez, "Next generation post processing in Call
 * of Duty: Advanced Warfare"), a box/tent mix close to a Gaussian, so each mip is the source blurred by about its
 * texel size, the prefiltered color for the cone tracing (Uludag, "Hi-Z Screen-Space Cone-Traced Reflections").
 */
export const COLOR_MIPN_WGSL = /* wgsl */ `
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var linearSampler: sampler;
@group(0) @binding(2) var destination: texture_storage_2d<rgba16float, write>;

fn tap(uv: vec2f, offset: vec2f, texel: vec2f) -> vec3f {
  return textureSampleLevel(source, linearSampler, uv + offset * texel, 0.0).rgb;
}

@compute @workgroup_size(${PYRAMID_WORKGROUP_SIZE}, ${PYRAMID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let targetSize = textureDimensions(destination);
  if (id.x >= targetSize.x || id.y >= targetSize.y) {
    return;
  }
  let texel = 1.0 / vec2f(textureDimensions(source));
  let uv = (vec2f(id.xy) + 0.5) / vec2f(targetSize);
  let a = tap(uv, vec2f(-2.0, -2.0), texel);
  let b = tap(uv, vec2f( 0.0, -2.0), texel);
  let c = tap(uv, vec2f( 2.0, -2.0), texel);
  let d = tap(uv, vec2f(-2.0,  0.0), texel);
  let e = tap(uv, vec2f( 0.0,  0.0), texel);
  let f = tap(uv, vec2f( 2.0,  0.0), texel);
  let g = tap(uv, vec2f(-2.0,  2.0), texel);
  let h = tap(uv, vec2f( 0.0,  2.0), texel);
  let i = tap(uv, vec2f( 2.0,  2.0), texel);
  let j = tap(uv, vec2f(-1.0, -1.0), texel);
  let k = tap(uv, vec2f( 1.0, -1.0), texel);
  let l = tap(uv, vec2f(-1.0,  1.0), texel);
  let m = tap(uv, vec2f( 1.0,  1.0), texel);
  var color = e * 0.125;
  color += (a + c + g + i) * 0.03125;
  color += (b + d + f + h) * 0.0625;
  color += (j + k + l + m) * 0.125;
  textureStore(destination, vec2i(id.xy), vec4f(color, 1.0));
}
`

/**
 * Previous color mip 0: the HDR color as is
 */
export const COLOR_COPY_WGSL = /* wgsl */ `
@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var destination: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(${PYRAMID_WORKGROUP_SIZE}, ${PYRAMID_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) id: vec3u) {
  let targetSize = textureDimensions(destination);
  if (id.x >= targetSize.x || id.y >= targetSize.y) {
    return;
  }
  textureStore(destination, vec2i(id.xy), textureLoad(source, vec2i(id.xy), 0));
}
`
