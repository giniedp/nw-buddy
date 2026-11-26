/**
 * CMAA2, Conservative Morphological Anti-Aliasing 2.3 (Filip Strugar, Intel, https://github.com/GameTechDev/CMAA2),
 * Copyright (c) 2018 Intel Corporation, Apache License 2.0. WGSL port of CMAA2.hlsl for the single sample, luma edge
 * detection path (CMAA2_EDGE_DETECTION_LUMA_PATH 1) with CMAA2_COLLECT_EXPAND_BLEND_ITEMS and
 * CMAA2_DEFERRED_APPLY_THREADGROUP_SWAP.
 *
 * Changes for WebGPU and the viewer:
 * - the input is the display encoded (sRGB) final image: colors are linearized on load and encoded on store, like the
 *   reference with an sRGB output (CMAA2_UAV_STORE_CONVERT_TO_SRGB)
 * - color loads outside the image clamp to the edge (the reference reads 0 there, which detects edges at the border)
 * - the edges are packed two pixels per u32 in a storage buffer (no r8uint storage textures in WebGPU)
 * - the deferred blend list heads are a storage buffer (WebGPU has no texture atomics)
 * - the indirect arguments are written by two small entry points instead of one entry point dispatched twice
 * - writes past the end of the work buffers are skipped (the reference relies on D3D dropping them)
 * - an extra entry point copies the input into the output, as the output is a separate texture
 * - quality settings are uniforms (threshold, local contrast adaptation, simple shape bluriness, extra sharpness)
 */
export const CMAA2_WGSL = /* wgsl */ `
struct Params {
  size                    : vec2<i32>, // width, height in pixels
  edgeStride              : u32,       // ceil(width / 2): u32 per edge row, also 2x2 quads per row
  extraSharpness          : u32,       // CMAA2_EXTRA_SHARPNESS
  threshold               : f32,       // g_CMAA2_EdgeThreshold
  localContrastAdaptation : f32,       // g_CMAA2_LocalContrastAdaptationAmount
  simpleShapeBluriness    : f32,       // g_CMAA2_SimpleShapeBlurinessAmount
  debug                   : u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var inColor: texture_2d<f32>;
@group(0) @binding(2) var outColor: texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var<storage, read_write> edgesBuffer: array<u32>;
@group(0) @binding(4) var<storage, read_write> shapeCandidates: array<u32>;
@group(0) @binding(5) var<storage, read_write> blendLocationList: array<u32>;
@group(0) @binding(6) var<storage, read_write> blendItemList: array<vec2<u32>>;
@group(0) @binding(7) var<storage, read_write> blendItemListHeads: array<atomic<u32>>;
// [3] items to process by the indirect dispatch, [4] shape candidates, [8] blend locations, [12] blend items
@group(0) @binding(8) var<storage, read_write> control: array<atomic<u32>, 16>;
@group(1) @binding(0) var<storage, read_write> indirectArgs: array<u32, 3>;

const INPUT_KERNEL_SIZE: u32 = 16u;
const OUTPUT_KERNEL_SIZE: i32 = 14;
const PROCESS_CANDIDATES_NUM_THREADS: u32 = 128u;
const DEFERRED_APPLY_NUM_THREADS: u32 = 32u;
const BLEND_ITEM_SLM_SIZE: u32 = 768u;
const MAX_LINE_LENGTH: f32 = 86.0;
const SYMMETRY_CORRECTION_OFFSET: f32 = 0.22;
const EMPTY: u32 = 0xFFFFFFFFu;
// the maximum dispatch size per dimension, the apply pass dispatches the blend locations along y
const MAX_WORKGROUPS: u32 = 65535u;

// #region Encoding

fn srgbToLinear(c: vec3f) -> vec3f {
  return select(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}

fn linearToSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c * 12.92, c < vec3f(0.0031308));
}

fn f32tof16(v: f32) -> u32 {
  return pack2x16float(vec2f(v, 0.0)) & 0xFFFFu;
}

fn f16tof32(v: u32) -> f32 {
  return unpack2x16float(v).x;
}

// R11G11B10 with one exponent bit moved into each mantissa ([0, 2) range), see Pack_R11G11B10_E4_FLOAT
fn packColor(color: vec3f) -> u32 {
  let rgb = clamp(color, vec3f(0.0), vec3f(bitcast<f32>(0x3FFFFFFFu)));
  let r = ((f32tof16(rgb.r) + 4u) >> 3u) & 0x000007FFu;
  let g = ((f32tof16(rgb.g) + 4u) << 8u) & 0x003FF800u;
  let b = ((f32tof16(rgb.b) + 8u) << 18u) & 0xFFC00000u;
  return r | g | b;
}

fn unpackColor(v: u32) -> vec3f {
  return vec3f(f16tof32((v << 3u) & 0x3FF8u), f16tof32((v >> 8u) & 0x3FF8u), f16tof32((v >> 18u) & 0x3FF0u));
}

// edges: x (0x01) right, y (0x02) bottom, z (0x04) left, w (0x08) top
fn packEdges(edges: vec4f) -> u32 {
  return u32(dot(edges, vec4f(1.0, 2.0, 4.0, 8.0)));
}

fn unpackEdges(v: u32) -> vec4f {
  return vec4f(vec4<bool>((v & 1u) != 0u, (v & 2u) != 0u, (v & 4u) != 0u, (v & 8u) != 0u));
}

fn isInside(p: vec2<i32>) -> bool {
  return all(p >= vec2<i32>(0)) && all(p < params.size);
}

// linear color, clamped to the image
fn loadSourceColor(p: vec2<i32>) -> vec3f {
  let q = clamp(p, vec2<i32>(0), params.size - 1);
  return srgbToLinear(saturate(textureLoad(inColor, q, 0).rgb));
}

fn loadEdge(p: vec2<i32>) -> u32 {
  if (!isInside(p)) {
    return 0u;
  }
  let packed = edgesBuffer[u32(p.y) * params.edgeStride + u32(p.x) / 2u];
  return (packed >> ((u32(p.x) % 2u) * 4u)) & 0xFu;
}

fn quadIndex(quadPos: vec2<u32>) -> u32 {
  return quadPos.y * params.edgeStride + quadPos.x;
}

// #endregion

// #region Deferred blend items

fn storeColorSample(pixelPos: vec2<i32>, color: vec3f, isComplexShape: bool) {
  if (!isInside(pixelPos)) {
    return;
  }
  let counterIndex = atomicAdd(&control[12], 1u);
  if (counterIndex >= arrayLength(&blendItemList)) {
    return;
  }
  let p = vec2<u32>(pixelPos);
  let quadPos = p / 2u;
  // {2 bits for the 2x2 quad location}, {3 bits for the MSAA sample index}, {1 bit isComplexShape}, {26 bits index}
  let offsetXY = (p.y % 2u) * 2u + (p.x % 2u);
  let header = (offsetXY << 30u) | (select(0u, 1u, isComplexShape) << 26u);
  let originalIndex = atomicExchange(&blendItemListHeads[quadIndex(quadPos)], counterIndex | header);
  blendItemList[counterIndex] = vec2<u32>(originalIndex, packColor(color));
  // first one added: a list of all quads with blend items
  if (originalIndex == EMPTY) {
    let edgeListCounter = atomicAdd(&control[8], 1u);
    if (edgeListCounter < arrayLength(&blendLocationList)) {
      blendLocationList[edgeListCounter] = (quadPos.x << 16u) | quadPos.y;
    }
  }
}

// #endregion

// #region Copy

// the output starts as a copy of the input, the apply pass overwrites the antialiased pixels
@compute @workgroup_size(8, 8, 1)
fn copyCS(@builtin(global_invocation_id) id: vec3u) {
  let p = vec2<i32>(id.xy);
  if (isInside(p)) {
    textureStore(outColor, p, textureLoad(inColor, p, 0));
  }
}

// #endregion

// #region Edge detection

var<workgroup> fracEdgesH: array<vec4f, 256>;
var<workgroup> fracEdgesV: array<vec4f, 256>;

// color -> luma for edges: Rec. 601 on gamma (sqrt) compressed components, like FXAA and the reference
fn lumaForEdges(linearRGB: vec3f) -> f32 {
  return dot(sqrt(linearRGB), vec3f(0.299, 0.587, 0.114));
}

fn computeEdgeLuma(x: u32, y: u32, lumas: array<f32, 8>) -> vec2f {
  return vec2f(abs(lumas[x + y * 3u] - lumas[x + 1u + y * 3u]), abs(lumas[x + y * 3u] - lumas[x + (y + 1u) * 3u]));
}

// e00, e10, e01, e11 of a 2x2 quad, x = vertical edge (right), y = horizontal edge (bottom)
fn loadQuadHV(addr: u32) -> array<vec2f, 4> {
  let h = fracEdgesH[addr];
  let v = fracEdgesV[addr];
  return array<vec2f, 4>(vec2f(v.x, h.x), vec2f(v.y, h.y), vec2f(v.z, h.z), vec2f(v.w, h.w));
}

// small kernel, 4-connecting-edges-only local contrast adaptation; the neighbourhood is indexed [x + 1][y + 1]
fn localContrastV(x: i32, y: i32, nb: array<array<vec2f, 4>, 4>) -> f32 {
  return max(max(nb[x + 1][y + 0].y, nb[x + 1][y + 1].y), max(nb[x + 2][y + 0].y, nb[x + 2][y + 1].y)) *
    params.localContrastAdaptation;
}

fn localContrastH(x: i32, y: i32, nb: array<array<vec2f, 4>, 4>) -> f32 {
  return max(max(nb[x + 0][y + 1].x, nb[x + 1][y + 1].x), max(nb[x + 0][y + 2].x, nb[x + 1][y + 2].x)) *
    params.localContrastAdaptation;
}

fn isEdge(value: f32) -> f32 {
  return select(0.0, 1.0, value > params.threshold);
}

@compute @workgroup_size(16, 16, 1)
fn edgesCS(@builtin(workgroup_id) groupID: vec3u, @builtin(local_invocation_id) groupThreadID: vec3u) {
  // screen position in the input (expanded) kernel, shifted one 2x2 block up/left
  let pixelPos = (vec2<i32>(groupID.xy) * OUTPUT_KERNEL_SIZE + vec2<i32>(groupThreadID.xy) - 1) * 2;
  let rowStride = INPUT_KERNEL_SIZE;
  let centerAddr = groupThreadID.x + groupThreadID.y * rowStride;
  let inOutputKernel = !(groupThreadID.x == INPUT_KERNEL_SIZE - 1u || groupThreadID.x == 0u ||
    groupThreadID.y == INPUT_KERNEL_SIZE - 1u || groupThreadID.y == 0u);

  var lumas: array<f32, 8>;
  for (var i = 0u; i < 8u; i++) {
    lumas[i] = lumaForEdges(loadSourceColor(pixelPos + vec2<i32>(i32(i % 3u), i32(i / 3u))));
  }
  let qe0 = computeEdgeLuma(0u, 0u, lumas);
  let qe1 = computeEdgeLuma(1u, 0u, lumas);
  let qe2 = computeEdgeLuma(0u, 1u, lumas);
  let qe3 = computeEdgeLuma(1u, 1u, lumas);
  fracEdgesV[centerAddr] = vec4f(qe0.x, qe1.x, qe2.x, qe3.x);
  fracEdgesH[centerAddr] = vec4f(qe0.y, qe1.y, qe2.y, qe3.y);

  workgroupBarrier();

  var outEdges = vec4<u32>(0u);
  if (inOutputKernel) {
    var topRow = fracEdgesH[centerAddr - rowStride].zw;    // top row's bottom edge
    var leftColumn = fracEdgesV[centerAddr - 1u].yw;       // left column's right edge
    let someNonZeroEdges = any((vec4f(qe0, qe1) + vec4f(qe2, qe3) + vec4f(topRow, leftColumn)) != vec4f(0.0));
    if (someNonZeroEdges) {
      // clear the deferred blend list head of the quad (it might not get items, clearing is cheaper than checking)
      if (isInside(pixelPos)) {
        atomicStore(&blendItemListHeads[quadIndex(vec2<u32>(pixelPos) / 2u)], EMPTY);
      }

      var nb: array<array<vec2f, 4>, 4>;
      var q = loadQuadHV(centerAddr - rowStride - 1u);
      nb[0][0] = q[3];
      q = loadQuadHV(centerAddr - rowStride);
      nb[1][0] = q[2];
      nb[2][0] = q[3];
      q = loadQuadHV(centerAddr - rowStride + 1u);
      nb[3][0] = q[2];
      q = loadQuadHV(centerAddr - 1u);
      nb[0][1] = q[1];
      nb[0][2] = q[3];
      q = loadQuadHV(centerAddr + 1u);
      nb[3][1] = q[0];
      nb[3][2] = q[2];
      q = loadQuadHV(centerAddr - 1u + rowStride);
      nb[0][3] = q[1];
      q = loadQuadHV(centerAddr + rowStride);
      nb[1][3] = q[0];
      nb[2][3] = q[1];
      nb[1][0].y = topRow.x;
      nb[2][0].y = topRow.y;
      nb[0][1].x = leftColumn.x;
      nb[0][2].x = leftColumn.y;
      nb[1][1] = qe0;
      nb[2][1] = qe1;
      nb[1][2] = qe2;
      nb[2][2] = qe3;

      topRow.x = isEdge(topRow.x - localContrastH(0, -1, nb));
      topRow.y = isEdge(topRow.y - localContrastH(1, -1, nb));
      leftColumn.x = isEdge(leftColumn.x - localContrastV(-1, 0, nb));
      leftColumn.y = isEdge(leftColumn.y - localContrastV(-1, 1, nb));

      var ce: array<vec4f, 4>;
      ce[0].x = isEdge(qe0.x - localContrastV(0, 0, nb));
      ce[0].y = isEdge(qe0.y - localContrastH(0, 0, nb));
      ce[1].x = isEdge(qe1.x - localContrastV(1, 0, nb));
      ce[1].y = isEdge(qe1.y - localContrastH(1, 0, nb));
      ce[2].x = isEdge(qe2.x - localContrastV(0, 1, nb));
      ce[2].y = isEdge(qe2.y - localContrastH(0, 1, nb));
      ce[3].x = isEdge(qe3.x - localContrastV(1, 1, nb));
      ce[3].y = isEdge(qe3.y - localContrastH(1, 1, nb));
      // left
      ce[0].z = leftColumn.x;
      ce[1].z = ce[0].x;
      ce[2].z = leftColumn.y;
      ce[3].z = ce[2].x;
      // top
      ce[0].w = topRow.x;
      ce[1].w = topRow.y;
      ce[2].w = ce[0].y;
      ce[3].w = ce[1].y;

      let qeOffsets = array<vec2<i32>, 4>(vec2<i32>(0, 0), vec2<i32>(1, 0), vec2<i32>(0, 1), vec2<i32>(1, 1));
      for (var i = 0u; i < 4u; i++) {
        let localPixelPos = pixelPos + qeOffsets[i];
        let edges = ce[i];
        // at least one two-edge corner: a candidate for simple or complex shape processing
        let isCandidate = (edges.x * edges.y + edges.y * edges.z + edges.z * edges.w + edges.w * edges.x) != 0.0;
        if (isCandidate && isInside(localPixelPos)) {
          let counterIndex = atomicAdd(&control[4], 1u);
          if (counterIndex < arrayLength(&shapeCandidates)) {
            shapeCandidates[counterIndex] = (u32(localPixelPos.x) << 18u) | u32(localPixelPos.y);
          }
        }
        // all edges are written, including empty pixels, so the shape tracing doesn't follow last frame's edges
        outEdges[i] = packEdges(edges);
      }
    }
  }

  if (inOutputKernel && isInside(pixelPos)) {
    let column = u32(pixelPos.x) / 2u;
    edgesBuffer[u32(pixelPos.y) * params.edgeStride + column] = (outEdges[1] << 4u) | outEdges[0];
    if (pixelPos.y + 1 < params.size.y) {
      edgesBuffer[u32(pixelPos.y + 1) * params.edgeStride + column] = (outEdges[3] << 4u) | outEdges[2];
    }
  }
}

// #endregion

// #region Indirect arguments

@compute @workgroup_size(1, 1, 1)
fn argsProcessCandidatesCS() {
  let count = min(atomicLoad(&control[4]), arrayLength(&shapeCandidates));
  indirectArgs[0] = (count + PROCESS_CANDIDATES_NUM_THREADS - 1u) / PROCESS_CANDIDATES_NUM_THREADS;
  indirectArgs[1] = 1u;
  indirectArgs[2] = 1u;
  atomicStore(&control[3], count);
}

@compute @workgroup_size(1, 1, 1)
fn argsDeferredApplyCS() {
  let count = min(min(atomicLoad(&control[8]), arrayLength(&blendLocationList)), MAX_WORKGROUPS * DEFERRED_APPLY_NUM_THREADS);
  indirectArgs[0] = 1u;
  indirectArgs[1] = (count + DEFERRED_APPLY_NUM_THREADS - 1u) / DEFERRED_APPLY_NUM_THREADS;
  indirectArgs[2] = 1u;
  atomicStore(&control[3], count);
  // clear the counters for the next frame
  atomicStore(&control[4], 0u);
  atomicStore(&control[8], 0u);
  atomicStore(&control[12], 0u);
}

// #endregion

// #region Shape processing

var<workgroup> groupBlendItemCount: atomic<u32>;
var<workgroup> groupBlendItems: array<vec2<u32>, 768>;

fn computeSimpleShapeBlendValues(edges: vec4f, edgesLeft: vec4f, edgesRight: vec4f, edgesTop: vec4f, edgesBottom: vec4f) -> vec4f {
  // a 3x3 kernel for higher quality handling of L-based shapes (still rather basic and conservative)
  var fromRight = edges.r;
  var fromBelow = edges.g;
  var fromLeft = edges.b;
  var fromAbove = edges.a;
  var blurCoeff = params.simpleShapeBluriness;
  let numberOfEdges = dot(edges, vec4f(1.0));
  let numberOfEdgesAllAround = dot(edgesLeft.bga + edgesRight.rga + edgesTop.rba + edgesBottom.rgb, vec3f(1.0));

  // L-like step shape
  if (numberOfEdges == 2.0) {
    blurCoeff *= 0.75;
    let k = 0.9;
    fromRight += k * (edges.g * edgesTop.r * (1.0 - edgesLeft.g) + edges.a * edgesBottom.r * (1.0 - edgesLeft.a));
    fromBelow += k * (edges.b * edgesRight.g * (1.0 - edgesTop.b) + edges.r * edgesLeft.g * (1.0 - edgesTop.r));
    fromLeft += k * (edges.a * edgesBottom.b * (1.0 - edgesRight.a) + edges.g * edgesTop.b * (1.0 - edgesRight.g));
    fromAbove += k * (edges.r * edgesLeft.a * (1.0 - edgesBottom.r) + edges.b * edgesRight.a * (1.0 - edgesBottom.b));
  }

  // dampen the blurring with many neighbouring edges, additionally preserves text and texture detail
  if (params.extraSharpness != 0u) {
    blurCoeff *= saturate(1.15 - numberOfEdgesAllAround / 8.0);
  } else {
    blurCoeff *= saturate(1.30 - numberOfEdgesAllAround / 10.0);
  }
  return vec4f(fromLeft, fromAbove, fromRight, fromBelow) * blurCoeff;
}

// (invertedZScore, normalZScore)
fn detectZsHorizontal(edges: vec4f, edgesM1P0: vec4f, edgesP1P0: vec4f, edgesP2P0: vec4f) -> vec2f {
  // Inverted Z case:
  //   __
  //  X|
  // --
  var invertedZScore = edges.r * edges.g * edgesP1P0.a;
  invertedZScore *= 2.0 + (edgesM1P0.g + edgesP2P0.a) - (edges.a + edgesP1P0.g) -
    0.7 * (edgesP2P0.g + edgesM1P0.a + edges.b + edgesP1P0.r);
  // Normal Z case:
  // __
  //  X|
  //   --
  var normalZScore = edges.r * edges.a * edgesP1P0.g;
  normalZScore *= 2.0 + (edgesM1P0.a + edgesP2P0.g) - (edges.g + edgesP1P0.a) -
    0.7 * (edgesP2P0.a + edgesM1P0.g + edges.b + edgesP1P0.r);
  return vec2f(invertedZScore, normalZScore);
}

// (lineLengthLeft, lineLengthRight)
fn findZLineLengths(screenPos: vec2<i32>, horizontal: bool, invertedZShape: bool, stepRight: vec2<i32>) -> vec2f {
  var maskTraceLeft: u32;
  var maskTraceRight: u32;
  if (horizontal) {
    maskTraceLeft = 0x08u; // tracing top edge
    maskTraceRight = 0x02u; // tracing bottom edge
  } else {
    maskTraceLeft = 0x04u; // tracing left edge
    maskTraceRight = 0x01u; // tracing right edge
  }
  if (invertedZShape) {
    let temp = maskTraceLeft;
    maskTraceLeft = maskTraceRight;
    maskTraceRight = temp;
  }
  let factor = select(1.25, 1.20, params.extraSharpness != 0u);

  var continueLeft = true;
  var continueRight = true;
  var lineLengthLeft = 1.0;
  var lineLengthRight = 1.0;
  loop {
    let edgeLeft = loadEdge(screenPos - stepRight * i32(lineLengthLeft));
    let edgeRight = loadEdge(screenPos + stepRight * (i32(lineLengthRight) + 1));
    // stop on encountering a 'stopping' edge (as defined by the masks)
    continueLeft = continueLeft && ((edgeLeft & maskTraceLeft) == maskTraceLeft);
    continueRight = continueRight && ((edgeRight & maskTraceRight) == maskTraceRight);
    lineLengthLeft += select(0.0, 1.0, continueLeft);
    lineLengthRight += select(0.0, 1.0, continueRight);

    var maxLR = max(lineLengthRight, lineLengthLeft);
    // both stopped? end the search by setting maxLR to the max length
    if (!continueLeft && !continueRight) {
      maxLR = MAX_LINE_LENGTH;
    }
    // either the longer one is ahead of the shorter (already stopped) one by more than a factor of x, or both stopped
    if (maxLR >= min(MAX_LINE_LENGTH, factor * min(lineLengthRight, lineLengthLeft) - (factor - 1.0))) {
      break;
    }
  }
  return vec2f(lineLengthLeft, lineLengthRight);
}

fn dampeningEffect() -> f32 {
  return select(0.15, 0.11, params.extraSharpness != 0u);
}

fn collectBlendZs(screenPos: vec2<i32>, horizontal: bool, invertedZShape: bool, shapeQualityScore: f32, lineLengthLeft: f32, lineLengthRight: f32) -> bool {
  let leftOdd = SYMMETRY_CORRECTION_OFFSET * (lineLengthLeft % 2.0);
  let rightOdd = SYMMETRY_CORRECTION_OFFSET * (lineLengthRight % 2.0);
  let dampenEffect = saturate((lineLengthLeft + lineLengthRight - shapeQualityScore) * dampeningEffect());
  let loopFrom = -floor((lineLengthLeft + 1.0) / 2.0) + 1.0;
  let loopTo = floor((lineLengthRight + 1.0) / 2.0);

  let blendItemCount = u32(loopTo - loopFrom + 1.0);
  var itemIndex = atomicAdd(&groupBlendItemCount, blendItemCount);
  if (itemIndex + blendItemCount > BLEND_ITEM_SLM_SIZE) {
    // mark the reserved slots that fit as empty, the caller falls back to blending in place
    for (var i = itemIndex; i < BLEND_ITEM_SLM_SIZE; i++) {
      groupBlendItems[i] = vec2<u32>(EMPTY, 0u);
    }
    return false;
  }

  let totalLength = (loopTo - loopFrom) + 1.0 - leftOdd - rightOdd;
  let lerpStep = 1.0 / totalLength;
  let lerpFromK = (0.5 - leftOdd - loopFrom) * lerpStep;
  let itemHeader = (u32(screenPos.x) << 18u) | u32(screenPos.y);
  let itemValStatic = (select(0u, 1u, horizontal) << 31u) | (select(0u, 1u, invertedZShape) << 30u);

  for (var i = loopFrom; i <= loopTo; i += 1.0) {
    let secondPart = select(0.0, 1.0, i > 0.0);
    let srcOffset = 1.0 - secondPart * 2.0;
    let lerpK = ((lerpStep * i + lerpFromK) * srcOffset + secondPart) * dampenEffect;
    let encoded = itemValStatic | (u32(i + 256.0) << 20u) | (u32(srcOffset + 256.0) << 10u) |
      u32(saturate(lerpK) * 1023.0 + 0.5);
    groupBlendItems[itemIndex] = vec2<u32>(itemHeader, encoded);
    itemIndex++;
  }
  return true;
}

fn blendDirection(horizontal: bool, invertedZShape: bool) -> vec2<i32> {
  let blendDir = select(vec2<i32>(-1, 0), vec2<i32>(0, -1), horizontal);
  return select(blendDir, -blendDir, invertedZShape);
}

fn stepRightOf(horizontal: bool) -> vec2<i32> {
  return select(vec2<i32>(0, -1), vec2<i32>(1, 0), horizontal);
}

// in-place fallback of collectBlendZs when the group shared item list is full
fn blendZs(screenPos: vec2<i32>, horizontal: bool, invertedZShape: bool, shapeQualityScore: f32, lineLengthLeft: f32, lineLengthRight: f32) {
  let blendDir = blendDirection(horizontal, invertedZShape);
  let stepRight = stepRightOf(horizontal);
  let leftOdd = SYMMETRY_CORRECTION_OFFSET * (lineLengthLeft % 2.0);
  let rightOdd = SYMMETRY_CORRECTION_OFFSET * (lineLengthRight % 2.0);
  let dampenEffect = saturate((lineLengthLeft + lineLengthRight - shapeQualityScore) * dampeningEffect());
  let loopFrom = -floor((lineLengthLeft + 1.0) / 2.0) + 1.0;
  let loopTo = floor((lineLengthRight + 1.0) / 2.0);
  let totalLength = (loopTo - loopFrom) + 1.0 - leftOdd - rightOdd;
  let lerpStep = 1.0 / totalLength;
  let lerpFromK = (0.5 - leftOdd - loopFrom) * lerpStep;

  for (var i = loopFrom; i <= loopTo; i += 1.0) {
    let secondPart = select(0.0, 1.0, i > 0.0);
    let srcOffset = 1.0 - secondPart * 2.0;
    let lerpK = ((lerpStep * i + lerpFromK) * srcOffset + secondPart) * dampenEffect;
    let pixelPos = screenPos + stepRight * i32(i);
    let colorCenter = loadSourceColor(pixelPos);
    let colorFrom = loadSourceColor(pixelPos + blendDir * i32(srcOffset));
    storeColorSample(pixelPos, mix(colorCenter, colorFrom, lerpK), true);
  }
}

fn processCandidate(candidate: u32) {
  let pixelID = shapeCandidates[candidate];
  let pixelPos = vec2<i32>(i32(pixelID >> 18u), i32(pixelID & 0x3FFFu));

  let edges = unpackEdges(loadEdge(pixelPos));
  let edgesLeft = unpackEdges(loadEdge(pixelPos + vec2<i32>(-1, 0)));
  let edgesRight = unpackEdges(loadEdge(pixelPos + vec2<i32>(1, 0)));
  let edgesBottom = unpackEdges(loadEdge(pixelPos + vec2<i32>(0, 1)));
  let edgesTop = unpackEdges(loadEdge(pixelPos + vec2<i32>(0, -1)));

  // simple shapes
  {
    let blendVal = computeSimpleShapeBlendValues(edges, edgesLeft, edgesRight, edgesTop, edgesBottom);
    let fourWeightSum = dot(blendVal, vec4f(1.0));
    let centerWeight = 1.0 - fourWeightSum;
    var outColor = loadSourceColor(pixelPos) * centerWeight;
    if (blendVal.x > 0.0) {
      outColor += blendVal.x * loadSourceColor(pixelPos + vec2<i32>(-1, 0));
    }
    if (blendVal.y > 0.0) {
      outColor += blendVal.y * loadSourceColor(pixelPos + vec2<i32>(0, -1));
    }
    if (blendVal.z > 0.0) {
      outColor += blendVal.z * loadSourceColor(pixelPos + vec2<i32>(1, 0));
    }
    if (blendVal.w > 0.0) {
      outColor += blendVal.w * loadSourceColor(pixelPos + vec2<i32>(0, 1));
    }
    storeColorSample(pixelPos, outColor, false);
  }

  // complex shapes - detect
  var maxScore: f32;
  var horizontal = true;
  var invertedZ = false;
  {
    // horizontal
    let edgesP2P0 = unpackEdges(loadEdge(pixelPos + vec2<i32>(2, 0)));
    let scores = detectZsHorizontal(edges, edgesLeft, edgesRight, edgesP2P0);
    maxScore = max(scores.x, scores.y);
    if (maxScore > 0.0) {
      invertedZ = scores.x > scores.y;
    }
  }
  {
    // vertical: the same code with the input rotated 90 degrees counter-clockwise (left becomes bottom, top becomes
    // left, right becomes top, bottom becomes right), the edges too (.argb)
    let edgesP2P0 = unpackEdges(loadEdge(pixelPos + vec2<i32>(0, -2)));
    let scores = detectZsHorizontal(edges.argb, edgesBottom.argb, edgesTop.argb, edgesP2P0.argb);
    let vertScore = max(scores.x, scores.y);
    if (vertScore > maxScore) {
      maxScore = vertScore;
      horizontal = false;
      invertedZ = scores.x > scores.y;
    }
  }

  if (maxScore > 0.0) {
    // 0 - best quality, 1 - some edges missing but ok, 2 & 3 - dubious but better than nothing
    var shapeQualityScore = clamp(4.0 - maxScore, 0.0, 3.0);
    shapeQualityScore = select(floor(shapeQualityScore), round(shapeQualityScore), params.extraSharpness != 0u);
    let lengths = findZLineLengths(pixelPos, horizontal, invertedZ, stepRightOf(horizontal)) - shapeQualityScore;
    if (lengths.x + lengths.y >= 5.0) {
      // try adding to the group shared list, fall back to in-place processing if full
      if (!collectBlendZs(pixelPos, horizontal, invertedZ, shapeQualityScore, lengths.x, lengths.y)) {
        blendZs(pixelPos, horizontal, invertedZ, shapeQualityScore, lengths.x, lengths.y);
      }
    }
  }
}

@compute @workgroup_size(128, 1, 1)
fn processCandidatesCS(@builtin(global_invocation_id) dispatchThreadID: vec3u, @builtin(local_invocation_id) groupThreadID: vec3u) {
  if (groupThreadID.x == 0u) {
    atomicStore(&groupBlendItemCount, 0u);
  }
  workgroupBarrier();

  let numCandidates = atomicLoad(&control[3]);
  if (dispatchThreadID.x < numCandidates) {
    processCandidate(dispatchThreadID.x);
  }

  workgroupBarrier();

  // spread the collected items over all threads
  let totalItemCount = min(BLEND_ITEM_SLM_SIZE, atomicLoad(&groupBlendItemCount));
  let loops = (totalItemCount + (PROCESS_CANDIDATES_NUM_THREADS - 1u) - groupThreadID.x) / PROCESS_CANDIDATES_NUM_THREADS;
  for (var loopIndex = 0u; loopIndex < loops; loopIndex++) {
    let index = loopIndex * PROCESS_CANDIDATES_NUM_THREADS + groupThreadID.x;
    let itemVal = groupBlendItems[index];
    if (itemVal.x == EMPTY) {
      continue;
    }
    let startingPos = vec2<i32>(i32(itemVal.x >> 18u), i32(itemVal.x & 0x3FFFu));
    let itemHorizontal = ((itemVal.y >> 31u) & 1u) != 0u;
    let itemInvertedZ = ((itemVal.y >> 30u) & 1u) != 0u;
    let itemStepIndex = i32((itemVal.y >> 20u) & 0x3FFu) - 256;
    let itemSrcOffset = i32((itemVal.y >> 10u) & 0x3FFu) - 256;
    let itemLerpK = f32(itemVal.y & 0x3FFu) / 1023.0;

    let itemPixelPos = startingPos + stepRightOf(itemHorizontal) * itemStepIndex;
    let colorCenter = loadSourceColor(itemPixelPos);
    let colorFrom = loadSourceColor(itemPixelPos + blendDirection(itemHorizontal, itemInvertedZ) * itemSrcOffset);
    storeColorSample(itemPixelPos, mix(colorCenter, colorFrom, itemLerpK), true);
  }
}

// #endregion

// #region Deferred apply

@compute @workgroup_size(4, 32, 1)
fn deferredColorApply2x2CS(@builtin(global_invocation_id) dispatchThreadID: vec3u, @builtin(local_invocation_id) groupThreadID: vec3u) {
  let numCandidates = atomicLoad(&control[3]);
  let currentCandidate = dispatchThreadID.y;
  let currentQuadOffsetXY = groupThreadID.x;
  if (currentCandidate >= numCandidates) {
    return;
  }

  let pixelID = blendLocationList[currentCandidate];
  let quadPos = vec2<u32>(pixelID >> 16u, pixelID & 0xFFFFu);
  let qeOffsets = array<vec2<u32>, 4>(vec2<u32>(0u, 0u), vec2<u32>(1u, 0u), vec2<u32>(0u, 1u), vec2<u32>(1u, 1u));
  let pixelPos = vec2<i32>(quadPos * 2u + qeOffsets[currentQuadOffsetXY]);

  var counterIndexWithHeader = atomicLoad(&blendItemListHeads[quadIndex(quadPos)]);
  var outColors = vec4f(0.0);
  let itemCount = arrayLength(&blendItemList);
  // the loop limit prevents bad data from hanging the GPU
  for (var i = 0u; counterIndexWithHeader != EMPTY && i < 32u; i++) {
    let offsetXY = (counterIndexWithHeader >> 30u) & 0x03u;
    let isComplexShape = ((counterIndexWithHeader >> 26u) & 0x01u) != 0u;
    let index = counterIndexWithHeader & ((1u << 26u) - 1u);
    if (index >= itemCount) {
      break;
    }
    let val = blendItemList[index];
    counterIndexWithHeader = val.x;
    if (offsetXY == currentQuadOffsetXY) {
      let weight = select(0.8, 1.8, isComplexShape);
      outColors += vec4f(unpackColor(val.y) * weight, weight);
    }
  }
  if (outColors.a == 0.0 || !isInside(pixelPos)) {
    return;
  }
  let alpha = textureLoad(inColor, pixelPos, 0).a;
  textureStore(outColor, pixelPos, vec4f(linearToSrgb(outColors.rgb / outColors.a), alpha));
}

// #endregion

// #region Debug

// shows the detected edges over the image (DebugDrawEdgesCS)
@compute @workgroup_size(16, 16, 1)
fn debugEdgesCS(@builtin(global_invocation_id) id: vec3u) {
  let p = vec2<i32>(id.xy);
  if (!isInside(p)) {
    return;
  }
  let edges = unpackEdges(loadEdge(p));
  if (dot(edges, vec4f(1.0)) > 0.0) {
    textureStore(outColor, p, vec4f(mix(edges.xyz, vec3f(0.5), edges.a * 0.2), 1.0));
  }
}

// #endregion
`
