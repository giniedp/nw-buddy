import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/**
 * SMAA 1x (Jimenez et al., http://www.iryoku.com/smaa/, MIT License), ported from the game's postaa.cfx
 * (CryEngine / Lumberyard port of SMAA.hlsl) with these changes:
 * - quality settings are uniforms (threshold, search steps, diagonal steps, corner rounding), the game compiles the
 *   "medium" preset (8 steps, no diagonals, no corner rounding)
 * - depth predication (SMAA.hlsl SMAACalculatePredicatedThreshold) from the linear view depth
 * - the search texture (Lumberyard's unpacked, unflipped 66x33) is read at exact texel centers, see searchLength
 * - neighborhood blending as in SMAA.hlsl (both sides of the strongest direction), in linear color: the input is
 *   display encoded (sRGB) after the film mapping
 *
 * Coordinates are texture coordinates with the origin at the top left, `rt` = (1/w, 1/h, w, h).
 */

const SMAA_PARAMS = /* wgsl */ `
struct SmaaParams {
  rt         : vec4f, // 1/width, 1/height, width, height
  quality    : vec4f, // threshold, max search steps, max diagonal search steps, corner rounding (0-100)
  predication: vec4f, // enabled, relative depth threshold, scale, strength
  debug      : vec4f, // x = mode: 0 off, 1 edges, 2 weights
};

@group(0) @binding(0) var<uniform> params: SmaaParams;
`

const SMAA_AREATEX_MAX_DISTANCE = 16
const SMAA_AREATEX_MAX_DISTANCE_DIAG = 20

/**
 * First pass: luma edge detection with optional depth predication. Writes edges into rg (left, top).
 */
export const SMAA_EDGES_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${SMAA_PARAMS}

@group(0) @binding(1) var colorTex: texture_2d<f32>;
// @unfilterable
@group(0) @binding(2) var depthTex: texture_2d<f32>;

fn lumaAt(p: vec2i) -> f32 {
  let size = vec2i(params.rt.zw);
  let c = textureLoad(colorTex, clamp(p, vec2i(0), size - 1), 0).rgb;
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

fn depthAt(p: vec2i) -> f32 {
  let size = vec2i(params.rt.zw);
  return textureLoad(depthTex, clamp(p, vec2i(0), size - 1), 0).r;
}

// SMAACalculatePredicatedThreshold, with a relative depth difference (the depth is linear, in view units)
fn predicatedThreshold(p: vec2i) -> vec2f {
  let threshold = params.quality.x;
  if (params.predication.x < 0.5) {
    return vec2f(threshold);
  }
  let d = depthAt(p);
  let neighbours = vec2f(depthAt(p + vec2i(-1, 0)), depthAt(p + vec2i(0, -1)));
  let delta = abs(vec2f(d) - neighbours) / max(max(vec2f(d), neighbours), vec2f(1e-4));
  let edges = step(vec2f(params.predication.y), delta);
  return params.predication.z * threshold * (vec2f(1.0) - params.predication.w * edges);
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let p = vec2i(in.position.xy);
  let threshold = predicatedThreshold(p);

  let L = lumaAt(p);
  let Lleft = lumaAt(p + vec2i(-1, 0));
  let Ltop = lumaAt(p + vec2i(0, -1));

  var delta = vec4f(abs(vec2f(L) - vec2f(Lleft, Ltop)), 0.0, 0.0);
  var edges = step(threshold, delta.xy);
  if (dot(edges, vec2f(1.0)) == 0.0) {
    return vec4f(0.0);
  }

  let Lright = lumaAt(p + vec2i(1, 0));
  let Lbottom = lumaAt(p + vec2i(0, 1));
  delta = vec4f(delta.xy, abs(vec2f(L) - vec2f(Lright, Lbottom)));
  var maxDelta = max(max(delta.x, delta.y), max(delta.z, delta.w));

  let Lleftleft = lumaAt(p + vec2i(-2, 0));
  let Ltoptop = lumaAt(p + vec2i(0, -2));
  delta = vec4f(delta.xy, abs(vec2f(Lleft, Ltop) - vec2f(Lleftleft, Ltoptop)));
  maxDelta = max(max(maxDelta, delta.z), delta.w);

  // local contrast adaptation (factor 2)
  edges *= step(vec2f(0.5 * maxDelta), delta.xy);
  return vec4f(edges, 0.0, 0.0);
}
`

/**
 * Second pass: blending weights (pattern search, area lookup, diagonals, corners)
 */
export const SMAA_WEIGHTS_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${SMAA_PARAMS}

@group(0) @binding(1) var edgesTex: texture_2d<f32>;
@group(0) @binding(2) var areaTex: texture_2d<f32>;
@group(0) @binding(3) var searchTex: texture_2d<f32>;
@group(0) @binding(4) var linearSampler: sampler;
@group(0) @binding(5) var pointSampler: sampler;

const AREATEX_MAX_DISTANCE: f32 = ${SMAA_AREATEX_MAX_DISTANCE}.0;
const AREATEX_MAX_DISTANCE_DIAG: f32 = ${SMAA_AREATEX_MAX_DISTANCE_DIAG}.0;
const AREATEX_PIXEL_SIZE = vec2f(1.0 / 160.0, 1.0 / 560.0);
const AREATEX_SUBTEX_SIZE: f32 = 1.0 / 7.0;
const SEARCHTEX_SIZE = vec2f(66.0, 33.0);

fn edgesAt(uv: vec2f) -> vec2f {
  return textureSampleLevel(edgesTex, linearSampler, uv, 0.0).rg;
}

// #region Diagonal search

fn searchDiag1(texcoord: vec2f, dir: vec2f, c: f32) -> f32 {
  var uv = texcoord + dir * params.rt.xy;
  var e = vec2f(0.0);
  var i = 0.0;
  let steps = params.quality.z;
  for (; i < steps; i += 1.0) {
    e = edgesAt(uv);
    if (dot(e, vec2f(1.0)) < 1.9) {
      break;
    }
    uv += dir * params.rt.xy;
  }
  return i + f32(e.g > 0.9) * c;
}

fn searchDiag2(texcoord: vec2f, dir: vec2f, c: f32) -> f32 {
  var uv = texcoord + dir * params.rt.xy;
  var e = vec2f(0.0);
  var i = 0.0;
  let steps = params.quality.z;
  for (; i < steps; i += 1.0) {
    e.g = edgesAt(uv).g;
    e.r = edgesAt(uv + vec2f(1.0, 0.0) * params.rt.xy).r;
    if (dot(e, vec2f(1.0)) < 1.9) {
      break;
    }
    uv += dir * params.rt.xy;
  }
  return i + f32(e.g > 0.9) * c;
}

fn areaDiag(distance: vec2f, e: vec2f, offset: f32) -> vec2f {
  var uv = AREATEX_MAX_DISTANCE_DIAG * e + distance;
  uv = AREATEX_PIXEL_SIZE * uv + 0.5 * AREATEX_PIXEL_SIZE;
  // diagonal areas are in the right half of the texture
  uv.x += 0.5;
  uv.y += AREATEX_SUBTEX_SIZE * offset;
  return textureSampleLevel(areaTex, linearSampler, uv, 0.0).rg;
}

fn calculateDiagWeights(texcoord: vec2f, e: vec2f) -> vec2f {
  var weights = vec2f(0.0);
  let rt = params.rt.xy;
  let maxSteps = params.quality.z;

  var d: vec2f;
  d.x = select(0.0, searchDiag1(texcoord, vec2f(-1.0, 1.0), 1.0), e.r > 0.0);
  d.y = searchDiag1(texcoord, vec2f(1.0, -1.0), 0.0);
  if (d.x + d.y > 2.0) {
    let coords = vec4f(-d.x, d.x, d.y, -d.y) * rt.xyxy + texcoord.xyxy;
    var c: vec4f;
    c.x = edgesAt(coords.xy + vec2f(-1.0, 0.0) * rt).g;
    c.y = edgesAt(coords.xy).r;
    c.z = edgesAt(coords.zw + vec2f(1.0, 0.0) * rt).g;
    c.w = edgesAt(coords.zw + vec2f(1.0, -1.0) * rt).r;
    var ce = 2.0 * c.xz + c.yw;
    ce *= step(d, vec2f(maxSteps - 1.0));
    weights += areaDiag(d, ce, 0.0);
  }

  d.x = searchDiag2(texcoord, vec2f(-1.0, -1.0), 0.0);
  let right = edgesAt(texcoord + vec2f(1.0, 0.0) * rt).r;
  d.y = select(0.0, searchDiag2(texcoord, vec2f(1.0, 1.0), 1.0), right > 0.0);
  if (d.x + d.y > 2.0) {
    let coords = vec4f(-d.x, -d.x, d.y, d.y) * rt.xyxy + texcoord.xyxy;
    var c: vec4f;
    c.x = edgesAt(coords.xy + vec2f(-1.0, 0.0) * rt).g;
    c.y = edgesAt(coords.xy + vec2f(0.0, -1.0) * rt).r;
    let cz = edgesAt(coords.zw + vec2f(1.0, 0.0) * rt);
    c.z = cz.g;
    c.w = cz.r;
    var ce = 2.0 * c.xz + c.yw;
    ce *= step(d, vec2f(maxSteps - 1.0));
    weights += areaDiag(d, ce, 0.0).gr;
  }
  return weights;
}

// #endregion

// #region Horizontal / vertical search

// Search length lookup in the unpacked 66x33 search texture of Lumberyard, which is not flipped: texel
// (32 * e.r + 33 * side, 32 * e.g), left half for left searches, right half (offset 0.5) for right searches. The
// texture stores the step counts 0, 1, 2 as bytes. (SMAA.hlsl SMAASearchLength reads a flipped, packed texture,
// the game's postaa.cfx maps e directly to texture coordinates.)
fn searchLength(e: vec2f, offset: f32) -> f32 {
  let texel = vec2f(32.0 * e.r + SEARCHTEX_SIZE.x * offset, 32.0 * e.g) + 0.5;
  return 255.0 * textureSampleLevel(searchTex, pointSampler, texel / SEARCHTEX_SIZE, 0.0).r;
}

fn searchXLeft(texcoord: vec2f, end: f32) -> f32 {
  var uv = texcoord;
  var e = vec2f(0.0, 1.0);
  while (uv.x > end && e.g > 0.8281 && e.r == 0.0) {
    e = edgesAt(uv);
    uv.x -= 2.0 * params.rt.x;
  }
  // undo the (-0.25, -0.125) offset, the bias of 1 and the last step, then disambiguate the last step's length
  return uv.x + params.rt.x * (3.25 - searchLength(e, 0.0));
}

fn searchXRight(texcoord: vec2f, end: f32) -> f32 {
  var uv = texcoord;
  var e = vec2f(0.0, 1.0);
  while (uv.x < end && e.g > 0.8281 && e.r == 0.0) {
    e = edgesAt(uv);
    uv.x += 2.0 * params.rt.x;
  }
  return uv.x - params.rt.x * (3.25 - searchLength(e, 0.5));
}

fn searchYUp(texcoord: vec2f, end: f32) -> f32 {
  var uv = texcoord;
  var e = vec2f(1.0, 0.0);
  while (uv.y > end && e.r > 0.8281 && e.g == 0.0) {
    e = edgesAt(uv);
    uv.y -= 2.0 * params.rt.y;
  }
  return uv.y + params.rt.y * (3.25 - searchLength(e.gr, 0.0));
}

fn searchYDown(texcoord: vec2f, end: f32) -> f32 {
  var uv = texcoord;
  var e = vec2f(1.0, 0.0);
  while (uv.y < end && e.r > 0.8281 && e.g == 0.0) {
    e = edgesAt(uv);
    uv.y += 2.0 * params.rt.y;
  }
  return uv.y - params.rt.y * (3.25 - searchLength(e.gr, 0.5));
}

fn area(distance: vec2f, e1: f32, e2: f32, offset: f32) -> vec2f {
  // rounding prevents precision errors of bilinear filtering
  var uv = AREATEX_MAX_DISTANCE * round(4.0 * vec2f(e1, e2)) + distance;
  uv = AREATEX_PIXEL_SIZE * uv + 0.5 * AREATEX_PIXEL_SIZE;
  uv.y += AREATEX_SUBTEX_SIZE * offset;
  return textureSampleLevel(areaTex, linearSampler, uv, 0.0).rg;
}

// #endregion

// #region Corners

fn detectHorizontalCornerPattern(weights: vec2f, texcoord: vec2f, d: vec2f) -> vec2f {
  let rounding = params.quality.w;
  if (rounding <= 0.0) {
    return weights;
  }
  let rt = params.rt.xy;
  let coords = vec4f(d.x, 0.0, d.y, 0.0) * rt.xyxy + texcoord.xyxy;
  let left = abs(d.x) < abs(d.y);
  var w = weights;
  var e: vec2f;
  e.r = edgesAt(coords.xy + vec2f(0.0, 1.0) * rt).r;
  e.g = edgesAt(coords.xy + vec2f(0.0, -2.0) * rt).r;
  if (left) {
    w *= saturate(vec2f(rounding / 100.0 + 1.0) - e);
  }
  e.r = edgesAt(coords.zw + vec2f(1.0, 1.0) * rt).r;
  e.g = edgesAt(coords.zw + vec2f(1.0, -2.0) * rt).r;
  if (!left) {
    w *= saturate(vec2f(rounding / 100.0 + 1.0) - e);
  }
  return w;
}

fn detectVerticalCornerPattern(weights: vec2f, texcoord: vec2f, d: vec2f) -> vec2f {
  let rounding = params.quality.w;
  if (rounding <= 0.0) {
    return weights;
  }
  let rt = params.rt.xy;
  let coords = vec4f(0.0, d.x, 0.0, d.y) * rt.xyxy + texcoord.xyxy;
  let left = abs(d.x) < abs(d.y);
  var w = weights;
  var e: vec2f;
  e.r = edgesAt(coords.xy + vec2f(1.0, 0.0) * rt).g;
  e.g = edgesAt(coords.xy + vec2f(-2.0, 0.0) * rt).g;
  if (left) {
    w *= saturate(vec2f(rounding / 100.0 + 1.0) - e);
  }
  e.r = edgesAt(coords.zw + vec2f(1.0, 1.0) * rt).g;
  e.g = edgesAt(coords.zw + vec2f(-2.0, 1.0) * rt).g;
  if (!left) {
    w *= saturate(vec2f(rounding / 100.0 + 1.0) - e);
  }
  return w;
}

// #endregion

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let rt = params.rt.xy;
  let texcoord = in.position.xy * rt;
  let pixcoord = floor(in.position.xy);
  let maxSteps = params.quality.y;

  let offset0 = texcoord.xyxy + vec4f(-0.25, -0.125, 1.25, -0.125) * rt.xyxy;
  let offset1 = texcoord.xyxy + vec4f(-0.125, -0.25, -0.125, 1.25) * rt.xyxy;
  let offset2 = vec4f(offset0.xz, offset1.yw) + vec4f(-2.0, 2.0, -2.0, 2.0) * rt.xxyy * maxSteps;

  var weights = vec4f(0.0);
  var e = textureLoad(edgesTex, vec2i(pixcoord), 0).rg;

  // edge at north
  if (e.g > 0.0) {
    var diag = vec2f(0.0);
    if (params.quality.z > 0.0) {
      diag = calculateDiagWeights(texcoord, e);
    }
    if (dot(diag, vec2f(1.0)) == 0.0) {
      var d: vec2f;
      var coords: vec2f;
      coords.x = searchXLeft(offset0.xy, offset2.x);
      coords.y = offset1.y;
      d.x = coords.x;
      // left crossing edges, two at a time with bilinear filtering (sampled at -0.25)
      let e1 = edgesAt(coords).r;
      coords.x = searchXRight(offset0.zw, offset2.y);
      d.y = coords.x;
      // distances in pixels, rounded like SMAA.hlsl (signed, the corner detection needs the side)
      d = round(d / rt.x - vec2f(pixcoord.x + 0.5));
      // the area texture is compressed quadratically
      let sqrtD = sqrt(abs(d));
      let e2 = edgesAt(coords + vec2f(1.0, 0.0) * rt).r;
      weights = vec4f(area(sqrtD, e1, e2, 0.0), weights.zw);
      weights = vec4f(detectHorizontalCornerPattern(weights.xy, texcoord, d), weights.zw);
    } else {
      weights = vec4f(diag, weights.zw);
      // diagonals have priority, skip the vertical processing
      e.r = 0.0;
    }
  }

  // edge at west
  if (e.r > 0.0) {
    var d: vec2f;
    var coords: vec2f;
    coords.y = searchYUp(offset1.xy, offset2.z);
    coords.x = offset0.x;
    d.x = coords.y;
    let e1 = edgesAt(coords).g;
    coords.y = searchYDown(offset1.zw, offset2.w);
    d.y = coords.y;
    d = round(d / rt.y - vec2f(pixcoord.y + 0.5));
    let sqrtD = sqrt(abs(d));
    let e2 = edgesAt(coords + vec2f(0.0, 1.0) * rt).g;
    weights = vec4f(weights.xy, area(sqrtD, e1, e2, 0.0));
    weights = vec4f(weights.xy, detectVerticalCornerPattern(weights.zw, texcoord, d));
  }
  return weights;
}
`

/**
 * Third pass: neighborhood blending, writes the antialiased color. Debug modes show the edges or the weights.
 */
export const SMAA_BLEND_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}
${SMAA_PARAMS}

@group(0) @binding(1) var colorTex: texture_2d<f32>;
@group(0) @binding(2) var blendTex: texture_2d<f32>;
@group(0) @binding(3) var edgesTex: texture_2d<f32>;

fn srgbToLinear(c: vec3f) -> vec3f {
  return select(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}

fn linearToSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c * 12.92, c <= vec3f(0.0031308));
}

fn colorAt(p: vec2i) -> vec4f {
  let size = vec2i(params.rt.zw);
  return textureLoad(colorTex, clamp(p, vec2i(0), size - 1), 0);
}

fn weightsAt(p: vec2i) -> vec4f {
  let size = vec2i(params.rt.zw);
  return textureLoad(blendTex, clamp(p, vec2i(0), size - 1), 0);
}

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let p = vec2i(in.position.xy);
  let center = colorAt(p);

  let mode = u32(params.debug.x);
  if (mode == 1u) {
    let e = textureLoad(edgesTex, p, 0).rg;
    return select(center, vec4f(e, 0.0, 1.0), dot(e, vec2f(1.0)) > 0.0);
  }
  if (mode == 2u) {
    let w = weightsAt(p);
    return select(center, vec4f(w.rg + w.ba, 0.0, 1.0), dot(w, vec4f(1.0)) > 0.0);
  }

  // a.x right, a.y top, a.z left, a.w bottom (SMAANeighborhoodBlendingPS)
  var a: vec4f;
  a.x = weightsAt(p + vec2i(1, 0)).a;
  a.y = weightsAt(p + vec2i(0, 1)).g;
  let own = weightsAt(p);
  a.w = own.r;
  a.z = own.b;
  if (dot(a, vec4f(1.0)) < 1e-5) {
    return center;
  }

  // blend along the direction with the larger weight, with both sides of it. The bilinear fetch of SMAA.hlsl at a
  // fractional offset along one axis is a lerp with the neighbor, done here in linear color.
  let h = max(a.x, a.z) > max(a.y, a.w);
  var weights: vec2f;
  var side1: vec4f;
  var side2: vec4f;
  if (h) {
    weights = a.xz;
    side1 = colorAt(p + vec2i(1, 0));
    side2 = colorAt(p + vec2i(-1, 0));
  } else {
    weights = a.yw;
    side1 = colorAt(p + vec2i(0, 1));
    side2 = colorAt(p + vec2i(0, -1));
  }
  let c = srgbToLinear(center.rgb);
  let c1 = mix(c, srgbToLinear(side1.rgb), weights.x);
  let c2 = mix(c, srgbToLinear(side2.rgb), weights.y);
  let total = weights.x + weights.y;
  let color = (c1 * weights.x + c2 * weights.y) / total;
  return vec4f(linearToSrgb(color), center.a);
}
`
