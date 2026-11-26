import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * Mirrors the FLAG_* constants of the shader
 */
export const TexturePreviewFlag = {
  /**
   * The values are linear (an sRGB or float format), encode them for the display
   */
  Encode: 1,
  /**
   * Two channel normal map: reconstruct z
   */
  NormalZ: 2,
  /**
   * snorm data: map -1..1 to 0..1
   */
  Signed: 4,
  /**
   * Alpha comes from the separate alpha texture (`.dds.a`)
   */
  AlphaTexture: 8,
  /**
   * The alpha texture keeps its value in r (A8, R8, BC4)
   */
  AlphaInRed: 16,
  /**
   * One channel format (BC4, R8, R16F, R32F): show r as grey
   */
  Single: 32,
} as const

/**
 * Mirrors the channel modes of the shader (`params.mode.z`)
 */
export const TexturePreviewChannels = {
  rgba: 0,
  rgb: 1,
  r: 2,
  g: 3,
  b: 4,
  alpha: 5,
} as const
export type TexturePreviewChannels = keyof typeof TexturePreviewChannels

/**
 * How a cubemap is shown (`params.size.w`): its faces one at a time, or mapped onto a sphere or a cube by direction
 */
export const TexturePreviewProjection = {
  faces: 0,
  sphere: 1,
  cube: 2,
} as const
export type TexturePreviewProjection = keyof typeof TexturePreviewProjection

/**
 * Maps a pixel onto a rotated sphere or cube inscribed in the placement square, and the direction from the center to
 * a cube face texel. Directions are world directions, as the engine samples the cubes, and the face rules are the
 * ones of the hardware cube lookup (D3D / WebGPU), applied by hand to the layers of the 2d array.
 */
const CUBE_PROJECTION_WGSL = /* wgsl */ `
// view space (x right, y up, z towards the viewer) to the world direction the engine samples the cube with.
// The engine looks up probe cubes with world directions as they are (probes.wgsl), the world is Z up with Y forward
// (SpaceBasis Z_UP_POS_Y): unrotated, the view looks along +Y, right is +X, up is +Z. The pitch turns around the
// view's right axis, the yaw around the world up axis.
fn rotateView(v: vec3f) -> vec3f {
  let cy = params.rotation.x;
  let sy = params.rotation.y;
  let cp = params.rotation.z;
  let sp = params.rotation.w;
  let pitched = vec3f(v.x, cp * v.y - sp * v.z, sp * v.y + cp * v.z);
  // right = +X, up = +Z, towards the viewer = -Y
  let world = vec3f(pitched.x, -pitched.z, pitched.y);
  return vec3f(cy * world.x - sy * world.y, sy * world.x + cy * world.y, world.z);
}

// the face and its texel coordinates (0..1) a direction points at
fn cubeFace(dir: vec3f) -> vec3f {
  let a = abs(dir);
  var face: f32;
  var uv: vec2f;
  var m: f32;
  if (a.x >= a.y && a.x >= a.z) {
    m = a.x;
    if (dir.x > 0.0) { face = 0.0; uv = vec2f(-dir.z, -dir.y); } else { face = 1.0; uv = vec2f(dir.z, -dir.y); }
  } else if (a.y >= a.z) {
    m = a.y;
    if (dir.y > 0.0) { face = 2.0; uv = vec2f(dir.x, dir.z); } else { face = 3.0; uv = vec2f(dir.x, -dir.z); }
  } else {
    m = a.z;
    if (dir.z > 0.0) { face = 4.0; uv = vec2f(dir.x, -dir.y); } else { face = 5.0; uv = vec2f(-dir.x, -dir.y); }
  }
  return vec3f(face, uv / m * 0.5 + 0.5);
}

// x, y: texel of mip 0, z: face, w: shading (0 = the pixel misses the shape)
fn projectCube(p: vec2f, projection: u32) -> vec4f {
  let center = params.placement.xy + params.size.xy * params.placement.zw * 0.5;
  let radius = params.size.x * params.placement.z * 0.5;
  let q = (p - center) / radius;
  var dir: vec3f;
  var shade = 1.0;
  if (projection == 1u) {
    let r2 = dot(q, q);
    if (r2 > 1.0) {
      return vec4f(0);
    }
    dir = rotateView(vec3f(q.x, -q.y, sqrt(1.0 - r2)));
  } else {
    // orthographic ray towards a cube whose corners touch the circle
    let h = 0.57735;
    let o = rotateView(vec3f(q.x, -q.y, 2.0));
    let d = rotateView(vec3f(0.0, 0.0, -1.0));
    let dd = select(d, vec3f(1e-6), abs(d) < vec3f(1e-6));
    let t1 = (vec3f(-h) - o) / dd;
    let t2 = (vec3f(h) - o) / dd;
    let tn = min(t1, t2);
    let tf = max(t1, t2);
    let tmin = max(max(tn.x, tn.y), tn.z);
    let tmax = min(min(tf.x, tf.y), tf.z);
    if (tmax < max(tmin, 0.0)) {
      return vec4f(0);
    }
    dir = o + d * tmin;
    // darken the edges, where two coordinates touch the box
    let onFace = vec3f(abs(dir) > vec3f(h * 0.985));
    shade = select(1.0, 0.45, onFace.x + onFace.y + onFace.z >= 2.0);
  }
  let f = cubeFace(dir);
  return vec4f(min(f.yz * params.size.xy, params.size.xy - 1.0), f.x, shade);
}
`

/**
 * The parameters, the alpha texture and the shading of a texel, shared by both variants. A variant adds the texture
 * binding `tex`, `loadTex` and the fragment main.
 */
const TEXTURE_PREVIEW_COMMON_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct Params {
  // x, y: top left of mip 0 in the view (pixels), z, w: pixels per mip 0 texel
  placement: vec4f,
  // x, y: mip 0 size in texels, z: mip of the alpha texture, w: projection of a cubemap
  size: vec4f,
  // x: mip, y: layer (or depth slice), z: channels, w: FLAG_* bits
  mode: vec4f,
  // cos and sin of the yaw (x, y) and the pitch (z, w) of a projected cubemap
  rotation: vec4f,
}

const FLAG_ENCODE = 1u;
const FLAG_NORMAL_Z = 2u;
const FLAG_SIGNED = 4u;
const FLAG_ALPHA_TEX = 8u;
const FLAG_A_IN_R = 16u;
const FLAG_SINGLE = 32u;

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(2) var alphaTex: texture_2d_array<f32>;

fn linearToSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c * 12.92, c <= vec3f(0.0031308));
}

fn checker(p: vec2f) -> vec3f {
  let cell = floor(p / 8.0);
  let odd = (i32(cell.x) + i32(cell.y)) & 1;
  return select(vec3f(0.3), vec3f(0.38), odd == 1);
}

// the texel of a mip, by the texel position of mip 0
fn mipTexel(texel0: vec2f, mip: u32, dims: vec2u) -> vec2i {
  return clamp(vec2i(floor(texel0 / f32(1u << mip))), vec2i(0), vec2i(dims) - 1);
}

fn loadAlpha(texel0: vec2f, mip: u32) -> vec4f {
  return textureLoad(alphaTex, mipTexel(texel0, mip, textureDimensions(alphaTex, mip)), 0, i32(mip));
}

// the texel position of mip 0 under the pixel p
fn placedTexel(p: vec2f) -> vec2f {
  return (p - params.placement.xy) / params.placement.zw;
}

// outside of the texture: the dimmed checkerboard
fn background(p: vec2f) -> vec4f {
  return vec4f(checker(p) * 0.5, 1);
}

// the color of pixel p showing the texel of mip 0 (of a layer or depth slice), shaded by a factor
fn shadeTexel(p: vec2f, texel: vec2f, layer: u32, flags: u32, shade: f32) -> vec4f {
  if (any(texel < vec2f(0)) || any(texel >= params.size.xy)) {
    return background(p);
  }
  let bg = checker(p);
  let mip = u32(params.mode.x);
  let channels = u32(params.mode.z);

  var v = loadTex(texel, mip, layer);
  if ((flags & FLAG_SIGNED) != 0u) {
    v = vec4f(v.xyz * 0.5 + 0.5, v.w);
  }
  if ((flags & FLAG_SINGLE) != 0u) {
    v = vec4f(v.rrr, 1);
  }
  if ((flags & FLAG_NORMAL_Z) != 0u) {
    let xy = v.xy * 2.0 - 1.0;
    v = vec4f(v.xy, sqrt(saturate(1.0 - dot(xy, xy))) * 0.5 + 0.5, v.w);
  }
  var alpha = v.w;
  if ((flags & FLAG_ALPHA_TEX) != 0u) {
    let a = loadAlpha(texel, u32(params.size.z));
    alpha = select(a.w, a.x, (flags & FLAG_A_IN_R) != 0u);
  }

  var rgb: vec3f;
  switch channels {
    case 2u: { rgb = v.rrr; }
    case 3u: { rgb = v.ggg; }
    case 4u: { rgb = v.bbb; }
    case 5u: { rgb = vec3f(alpha); }
    default: { rgb = v.rgb; }
  }
  rgb = saturate(rgb) * shade;
  if ((flags & FLAG_ENCODE) != 0u) {
    rgb = linearToSrgb(rgb);
  }
  if (channels == 0u) {
    rgb = mix(bg, rgb, saturate(alpha));
  }
  return vec4f(rgb, 1);
}
`

/**
 * Texture preview: one texture drawn into the view over a checkerboard, texel exact (textureLoad, so every format
 * works, also unfilterable floats).
 *
 * The output is display encoded, like the end of the scene pipeline (film mapping writes sRGB values and the canvas
 * takes them as they are): linear values are encoded, stored values of other formats are shown as they are.
 *
 * This variant takes 2d textures as 2d arrays, and draws cubemaps onto a sphere or a cube, see
 * {@link TexturePreviewProjection}.
 */
export const TEXTURE_PREVIEW_WGSL = /* wgsl */ `
${TEXTURE_PREVIEW_COMMON_WGSL}
${CUBE_PROJECTION_WGSL}

@group(0) @binding(1) var tex: texture_2d_array<f32>;

fn loadTex(texel0: vec2f, mip: u32, layer: u32) -> vec4f {
  return textureLoad(tex, mipTexel(texel0, mip, textureDimensions(tex, mip)), i32(layer), i32(mip));
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let p = in.position.xy;
  let layer = u32(params.mode.y);
  let flags = u32(params.mode.w);
  let projection = u32(params.size.w);
  if (projection == 0u) {
    return shadeTexel(p, placedTexel(p), layer, flags, 1.0);
  }
  let hit = projectCube(p, projection);
  if (hit.w == 0.0) {
    return background(p);
  }
  // the alpha texture is not a cubemap
  return shadeTexel(p, hit.xy, u32(hit.z), flags & ~FLAG_ALPHA_TEX, hit.w);
}
`

/**
 * The texture preview of 3d textures, see {@link TEXTURE_PREVIEW_WGSL}: the layer is the depth slice of mip 0
 */
export const TEXTURE_PREVIEW_3D_WGSL = /* wgsl */ `
${TEXTURE_PREVIEW_COMMON_WGSL}

@group(0) @binding(1) var tex: texture_3d<f32>;

fn loadTex(texel0: vec2f, mip: u32, layer: u32) -> vec4f {
  let dims = textureDimensions(tex, mip);
  let slice = clamp(i32(layer >> mip), 0, i32(dims.z) - 1);
  return textureLoad(tex, vec3i(mipTexel(texel0, mip, dims.xy), slice), i32(mip));
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let p = in.position.xy;
  return shadeTexel(p, placedTexel(p), u32(params.mode.y), u32(params.mode.w), 1.0);
}
`
