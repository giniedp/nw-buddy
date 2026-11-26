export const BC3_ENCODE_SHADER = /* wgsl */ `
// BC3 / DXT5 Compute Encoder
//
// One workgroup per 4x4 texel block.
// All 16 threads sample the source texture in parallel into workgroup memory.
// Thread 0 performs endpoint selection, index resolution, and output.
//
// Dispatch: (textureWidth / 4, textureHeight / 4, 1)
// Output:   storage buffer of u32, 4 x u32 per block (16 bytes), row-major
//           [alphaWord0, alphaWord1, colorWord0, colorWord1]

// ---------------------------------------------------------------------------
// Bindings
// ---------------------------------------------------------------------------

struct Uniforms {
  // x = scale RGB, y
  // y = alpha selector (0 = sourceTexture.a, 1 = sourceAlpha.x, 2 = sourceAlpha.y)
  params : vec4f,
}

@group(0) @binding(0) var sourceTexture : texture_2d<f32>;
@group(0) @binding(1) var sourceAlpha : texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;
@group(0) @binding(3) var<storage, read_write> outputBuffer : array<u32>;

// ---------------------------------------------------------------------------
// Workgroup shared sample cache
// ---------------------------------------------------------------------------

var<workgroup> samples : array<vec4f, 16>;

// ---------------------------------------------------------------------------
// Alpha index resolution
//
// Analytically maps a normalized alpha value to its 3-bit BC3 palette index.
// Palette (a0 = max, a1 = min, 6 interpolated steps between them):
//
//   index 0 → a0                        (value > 13/14)
//   index 1 → a1                        (value <  1/14)
//   index 2 → (6*a0 + 1*a1) / 7
//   index 3 → (5*a0 + 2*a1) / 7
//   index 4 → (4*a0 + 3*a1) / 7
//   index 5 → (3*a0 + 4*a1) / 7
//   index 6 → (2*a0 + 5*a1) / 7
//   index 7 → (1*a0 + 6*a1) / 7        (value > 1/14, < 3/14)
// ---------------------------------------------------------------------------

fn alphaIndex(alphaSample: f32, alphaMin: f32, alphaRange: f32) -> u32 {
    let normalized = saturate((alphaSample - alphaMin) / alphaRange);

    let select0 = vec4f(normalized) > vec4f(0.0,      1.0/14.0,  3.0/14.0,  5.0/14.0);
    let select1 = vec4f(normalized) > vec4f(7.0/14.0, 9.0/14.0, 11.0/14.0, 13.0/14.0);

    let index = i32(dot(vec4f(select0), vec4f( 1.0,  6.0, -1.0, -1.0)))
              + i32(dot(vec4f(select1), vec4f(-1.0, -1.0, -1.0, -2.0)));

    return u32(index);
}

// ---------------------------------------------------------------------------
// Alpha block encoder
//
// Port of the alpha section in CompressTextureDXT5.
// alpha0 = max (low byte), alpha1 = min (high byte).
// Indices packed into two u32s covering 16 x 3 bits = 48 bits total.
// ---------------------------------------------------------------------------

fn encodeAlphaBlock(minAlpha: f32, maxAlpha: f32) -> vec2u {

    let alpha0 = u32(round(maxAlpha * 255.0));   // max → alpha0
    let alpha1 = u32(round(minAlpha * 255.0));   // min → alpha1

    var first8  = 0u;   // indices for pixels 0..7
    var second8 = 0u;   // indices for pixels 8..15

    if alpha0 != alpha1 {
        let alphaRange = maxAlpha - minAlpha;

        for (var i = 0u; i < 8u; i++) {
            let index = alphaIndex(samples[i].a, minAlpha, alphaRange);
            first8 |= (index & 0x7u) << (i * 3u);
        }

        for (var i = 8u; i < 16u; i++) {
            let index = alphaIndex(samples[i].a, minAlpha, alphaRange);
            second8 |= (index & 0x7u) << ((i - 8u) * 3u);
        }
    }

    // reference packing:
    //   dxtAlphaBlock0: alpha0[7:0] | alpha1[15:8] | first8[31:16]
    //   dxtAlphaBlock1: first8[7:0] | second8[31:8]
    let word0 = (alpha0  & 0xFFu)
              | ((alpha1  & 0xFFu)    <<  8u)
              | ((first8  & 0xFFFFu)  << 16u);

    let word1 = (first8   >> 16u)
              | ((second8 & 0xFFFFFFu) << 8u);

    return vec2u(word0, word1);
}

// ---------------------------------------------------------------------------
// RGB565: R and B 5 bits, G 6 bits
// ---------------------------------------------------------------------------

fn fromRGB565(c: u32) -> vec3f {
    return vec3f(f32((c >> 11u) & 31u), f32((c >> 5u) & 63u), f32(c & 31u)) / vec3f(31.0, 63.0, 31.0);
}

const RGB565_MAX = vec3i(31, 63, 31);

// round, truncation biases r/b (5 bit) more than g (6 bit) and tints the result
fn quantize565(color: vec3f) -> vec3i {
    return vec3i(round(saturate(color) * vec3f(RGB565_MAX)));
}

fn pack565(q: vec3i) -> u32 {
    return (u32(q.r) << 11u) | (u32(q.g) << 5u) | u32(q.b);
}

// squared error of the block when every sample takes its nearest palette entry of the quantized endpoints
fn paletteError(a: vec3i, b: vec3i) -> f32 {
    let e0 = vec3f(a) / vec3f(RGB565_MAX);
    let e1 = vec3f(b) / vec3f(RGB565_MAX);
    let p2 = (2.0 * e0 + e1) / 3.0;
    let p3 = (e0 + 2.0 * e1) / 3.0;
    var total = 0.0;
    for (var i = 0u; i < 16u; i++) {
        let c = samples[i].rgb;
        total += min(min(dot(c - e0, c - e0), dot(c - e1, c - e1)), min(dot(c - p2, c - p2), dot(c - p3, c - p3)));
    }
    return total;
}

// ---------------------------------------------------------------------------
// Color block encoder
//
// Endpoints: bounding box, diagonal selected by the covariance signs relative to R
// (min/max corners alone leave the color line and shift the hue), inset by 1/16.
// Refinement: greedy search, per channel the 3x3 offsets of the quantized endpoints that lower the palette error.
// Flat dark blocks (e.g. sand stored as sqrt) otherwise round each channel independently and get tinted,
// the search brackets the color so that the 1/3 and 2/3 palette entries hit it.
// Indices: nearest palette entry of the quantized endpoints, as the decoder sees them.
// ---------------------------------------------------------------------------

fn encodeColorBlock(minIn: vec3f, maxIn: vec3f) -> vec2u {
    var minColor = minIn;
    var maxColor = maxIn;

    // select diagonal
    let center = (minColor + maxColor) * 0.5;
    var covRG = 0.0;
    var covRB = 0.0;
    for (var i = 0u; i < 16u; i++) {
        let d = samples[i].rgb - center;
        covRG += d.r * d.g;
        covRB += d.r * d.b;
    }
    if covRG < 0.0 {
        let t = minColor.g;
        minColor.g = maxColor.g;
        maxColor.g = t;
    }
    if covRB < 0.0 {
        let t = minColor.b;
        minColor.b = maxColor.b;
        maxColor.b = t;
    }

    // inset
    let inset = (maxColor - minColor) / 16.0;
    minColor += inset;
    maxColor -= inset;

    var qa = quantize565(maxColor);
    var qb = quantize565(minColor);
    var bestError = paletteError(qa, qb);
    for (var iteration = 0u; iteration < 2u; iteration++) {
        for (var ch = 0u; ch < 3u; ch++) {
            var bestA = qa;
            var bestB = qb;
            for (var d0 = -1; d0 <= 1; d0++) {
                for (var d1 = -1; d1 <= 1; d1++) {
                    if d0 == 0 && d1 == 0 {
                        continue;
                    }
                    var na = qa;
                    var nb = qb;
                    na[ch] += d0;
                    nb[ch] += d1;
                    let limit = select(31, 63, ch == 1u);
                    if na[ch] < 0 || na[ch] > limit || nb[ch] < 0 || nb[ch] > limit {
                        continue;
                    }
                    let e = paletteError(na, nb);
                    if e < bestError {
                        bestError = e;
                        bestA = na;
                        bestB = nb;
                    }
                }
            }
            qa = bestA;
            qb = bestB;
        }
    }

    var c0 = pack565(qa);
    var c1 = pack565(qb);
    // color0 > color1 selects 4-color mode on decode
    if c0 < c1 {
        let t = c0;
        c0 = c1;
        c1 = t;
    }
    let colorWord0 = (c0 & 0xFFFFu) | ((c1 & 0xFFFFu) << 16u);
    var colorWord1 = 0u;

    if c0 != c1 {
        let e0 = fromRGB565(c0);
        let e1 = fromRGB565(c1);
        let p2 = (2.0 * e0 + e1) / 3.0;
        let p3 = (e0 + 2.0 * e1) / 3.0;
        for (var i = 0u; i < 16u; i++) {
            let c = samples[i].rgb;
            let d = vec4f(dot(c - e0, c - e0), dot(c - e1, c - e1), dot(c - p2, c - p2), dot(c - p3, c - p3));
            var index = 0u;
            var best = d.x;
            if d.y < best { best = d.y; index = 1u; }
            if d.z < best { best = d.z; index = 2u; }
            if d.w < best { best = d.w; index = 3u; }
            colorWord1 |= index << (i * 2u);
        }
    }

    return vec2u(colorWord0, colorWord1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

@compute @workgroup_size(4, 4, 1)
fn main(
    @builtin(workgroup_id)         blockId    : vec3u,
    @builtin(local_invocation_id)  threadId   : vec3u,
) {
    // source view is mip-scoped → always query and load at level 0
    let textureDims = textureDimensions(sourceTexture, 0);
    let pixelCoord  = blockId.xy * 4u + threadId.xy;
    let localIndex  = threadId.y * 4u + threadId.x;

    // all 16 threads sample in parallel, clamp boundary block coords to edge
    let safeCoord = min(pixelCoord, textureDims - 1u);
    let raw = textureLoad(sourceTexture, safeCoord, 0);
    let alphaSrc = textureLoad(sourceAlpha, safeCoord, 0);
    let useAlpha = uniforms.params.y >= 1.0; // use either .r or .g of sourceAlpha based on selector
    let useG     = uniforms.params.y >= 2.0; // use .g

    var color    = raw.rgb * uniforms.params.x;
    if (uniforms.params.z >= 1.0) {
      color = sqrt(saturate(color));
    }
    let alpha    = select(raw.a, select(alphaSrc.r, alphaSrc.g, useG), useAlpha);
    samples[localIndex] = vec4f(color, alpha);

    workgroupBarrier();

    // thread 0 does all encoding — matches reference [branch] if (x==0 && y==0)
    if threadId.x != 0u || threadId.y != 0u { return; }

    // component-wise min/max across all 16 samples — matches reference
    var minColor = samples[0].rgb;
    var maxColor = samples[0].rgb;
    var minAlpha = samples[0].a;
    var maxAlpha = samples[0].a;

    for (var i = 1u; i < 16u; i++) {
        minColor = min(minColor, samples[i].rgb);
        maxColor = max(maxColor, samples[i].rgb);
        minAlpha = min(minAlpha, samples[i].a);
        maxAlpha = max(maxAlpha, samples[i].a);
    }

    let alphaWords = encodeAlphaBlock(minAlpha, maxAlpha);
    let colorWords = encodeColorBlock(minColor, maxColor);

    // write 4 x u32 = 16 bytes, row-major — matches reference OutputTexture[GroupID.xy]
    let blocksPerRow = (textureDims.x + 3u) / 4u;
    let blockIndex   = blockId.y * blocksPerRow + blockId.x;
    let outBase      = blockIndex * 4u;

    outputBuffer[outBase + 0u] = alphaWords.x;
    outputBuffer[outBase + 1u] = alphaWords.y;
    outputBuffer[outBase + 2u] = colorWords.x;
    outputBuffer[outBase + 3u] = colorWords.y;
}

`
