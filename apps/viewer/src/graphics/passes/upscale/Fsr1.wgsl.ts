import { FULLSCREEN_WGSL_VS } from '@gglib/effects'

/*
 * AMD FidelityFX Super Resolution 1.0 (FSR 1): EASU (edge adaptive spatial upsampling) and RCAS (robust contrast
 * adaptive sharpening), fp32 path, ported to WGSL from ffx_fsr1.h.
 *
 * Copyright (c) 2021 Advanced Micro Devices, Inc. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Differences to the original: the approximate reciprocals (APrxLoRcpF1, APrxMedRcpF1) are divisions, guarded where
 * the original relies on the approximation of 1/0 being large but finite. The constants are floats, not packed u32.
 * The input is the final image with sRGB encoded values (perceptual space, after the post AA), as FSR 1 expects.
 */

/**
 * EASU: render size → output size. Constants of FsrEasuCon (Fsr1Pass.ts `easuConstants`).
 */
export const FSR1_EASU_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct EasuParams {
  con0: vec4f,
  con1: vec4f,
  con2: vec4f,
  con3: vec4f,
};

@group(0) @binding(0) var<uniform> easu: EasuParams;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;

fn rcpSafe(x: f32) -> f32 {
  // APrxLoRcpF1 returns a large finite value for 0, the products with it are 0 there
  return 1.0 / max(x, 1.0e-8);
}

// accumulates the direction and the edge length of one bilinear quadrant (FsrEasuSetF)
fn easuSet(dir: ptr<function, vec2f>, len: ptr<function, f32>, w: f32, lA: f32, lB: f32, lC: f32, lD: f32, lE: f32) {
  let dc = lD - lC;
  let cb = lC - lB;
  var lenX = rcpSafe(max(abs(dc), abs(cb)));
  let dirX = lD - lB;
  (*dir).x += dirX * w;
  lenX = saturate(abs(dirX) * lenX);
  lenX *= lenX;
  *len += lenX * w;

  let ec = lE - lC;
  let ca = lC - lA;
  var lenY = rcpSafe(max(abs(ec), abs(ca)));
  let dirY = lE - lA;
  (*dir).y += dirY * w;
  lenY = saturate(abs(dirY) * lenY);
  lenY *= lenY;
  *len += lenY * w;
}

// one tap of the stretched, rotated lanczos-like kernel (FsrEasuTapF)
fn easuTap(aC: ptr<function, vec3f>, aW: ptr<function, f32>, off: vec2f, dir: vec2f, len: vec2f, lob: f32, clp: f32, c: vec3f) {
  var v = vec2f(off.x * dir.x + off.y * dir.y, off.x * -dir.y + off.y * dir.x);
  v *= len;
  let d2 = min(v.x * v.x + v.y * v.y, clp);
  var wB = (2.0 / 5.0) * d2 - 1.0;
  var wA = lob * d2 - 1.0;
  wB *= wB;
  wA *= wA;
  wB = (25.0 / 16.0) * wB - (25.0 / 16.0 - 1.0);
  let w = wB * wA;
  *aC += c * w;
  *aW += w;
}

@fragment
fn fs_easu(in: FragmentInput) -> @location(0) vec4f {
  let ip = floor(in.position.xy);
  var pp = ip * easu.con0.xy + easu.con0.zw;
  let fp = floor(pp);
  pp -= fp;

  // 12-tap kernel
  //    b c
  //  e f g h
  //  i j k l
  //    n o
  let p0 = fp * easu.con1.xy + easu.con1.zw;
  let p1 = p0 + easu.con2.xy;
  let p2 = p0 + easu.con2.zw;
  let p3 = p0 + easu.con3.xy;
  // gather order (x, y, z, w) = (u0 v1), (u1 v1), (u1 v0), (u0 v0)
  let bczzR = textureGather(0, source, linearSampler, p0);
  let bczzG = textureGather(1, source, linearSampler, p0);
  let bczzB = textureGather(2, source, linearSampler, p0);
  let ijfeR = textureGather(0, source, linearSampler, p1);
  let ijfeG = textureGather(1, source, linearSampler, p1);
  let ijfeB = textureGather(2, source, linearSampler, p1);
  let klhgR = textureGather(0, source, linearSampler, p2);
  let klhgG = textureGather(1, source, linearSampler, p2);
  let klhgB = textureGather(2, source, linearSampler, p2);
  let zzonR = textureGather(0, source, linearSampler, p3);
  let zzonG = textureGather(1, source, linearSampler, p3);
  let zzonB = textureGather(2, source, linearSampler, p3);

  // luma times 2
  let bczzL = bczzB * 0.5 + (bczzR * 0.5 + bczzG);
  let ijfeL = ijfeB * 0.5 + (ijfeR * 0.5 + ijfeG);
  let klhgL = klhgB * 0.5 + (klhgR * 0.5 + klhgG);
  let zzonL = zzonB * 0.5 + (zzonR * 0.5 + zzonG);
  let bL = bczzL.x;
  let cL = bczzL.y;
  let iL = ijfeL.x;
  let jL = ijfeL.y;
  let fL = ijfeL.z;
  let eL = ijfeL.w;
  let kL = klhgL.x;
  let lL = klhgL.y;
  let hL = klhgL.z;
  let gL = klhgL.w;
  let oL = zzonL.z;
  let nL = zzonL.w;

  // direction and length from the 4 bilinear quadrants around f g j k
  var dir = vec2f(0.0);
  var len = 0.0;
  easuSet(&dir, &len, (1.0 - pp.x) * (1.0 - pp.y), bL, eL, fL, gL, jL);
  easuSet(&dir, &len, pp.x * (1.0 - pp.y), cL, fL, gL, hL, kL);
  easuSet(&dir, &len, (1.0 - pp.x) * pp.y, fL, iL, jL, kL, nL);
  easuSet(&dir, &len, pp.x * pp.y, gL, jL, kL, lL, oL);

  // normalize the direction, a zero vector becomes (1, 0)
  let dir2 = dir * dir;
  var dirR = dir2.x + dir2.y;
  let zro = dirR < 1.0 / 32768.0;
  dirR = select(inverseSqrt(max(dirR, 1.0e-20)), 1.0, zro);
  dir.x = select(dir.x, 1.0, zro);
  dir *= dirR;
  // shape the length: 0 isotropic, 1 full edge
  len = len * 0.5;
  len *= len;
  // stretch along the edge, 1 for axis aligned, sqrt(2) on the diagonal
  let stretch = (dir.x * dir.x + dir.y * dir.y) / max(abs(dir.x), abs(dir.y));
  let len2 = vec2f(1.0 + (stretch - 1.0) * len, 1.0 - 0.5 * len);
  // negative lobe strength and the clip point of the kernel window
  let lob = 0.5 + ((1.0 / 4.0 - 0.04) - 0.5) * len;
  let clp = 1.0 / lob;

  var aC = vec3f(0.0);
  var aW = 0.0;
  easuTap(&aC, &aW, vec2f(0.0, -1.0) - pp, dir, len2, lob, clp, vec3f(bczzR.x, bczzG.x, bczzB.x)); // b
  easuTap(&aC, &aW, vec2f(1.0, -1.0) - pp, dir, len2, lob, clp, vec3f(bczzR.y, bczzG.y, bczzB.y)); // c
  easuTap(&aC, &aW, vec2f(-1.0, 1.0) - pp, dir, len2, lob, clp, vec3f(ijfeR.x, ijfeG.x, ijfeB.x)); // i
  easuTap(&aC, &aW, vec2f(0.0, 1.0) - pp, dir, len2, lob, clp, vec3f(ijfeR.y, ijfeG.y, ijfeB.y)); // j
  easuTap(&aC, &aW, vec2f(0.0, 0.0) - pp, dir, len2, lob, clp, vec3f(ijfeR.z, ijfeG.z, ijfeB.z)); // f
  easuTap(&aC, &aW, vec2f(-1.0, 0.0) - pp, dir, len2, lob, clp, vec3f(ijfeR.w, ijfeG.w, ijfeB.w)); // e
  easuTap(&aC, &aW, vec2f(1.0, 1.0) - pp, dir, len2, lob, clp, vec3f(klhgR.x, klhgG.x, klhgB.x)); // k
  easuTap(&aC, &aW, vec2f(2.0, 1.0) - pp, dir, len2, lob, clp, vec3f(klhgR.y, klhgG.y, klhgB.y)); // l
  easuTap(&aC, &aW, vec2f(2.0, 0.0) - pp, dir, len2, lob, clp, vec3f(klhgR.z, klhgG.z, klhgB.z)); // h
  easuTap(&aC, &aW, vec2f(1.0, 0.0) - pp, dir, len2, lob, clp, vec3f(klhgR.w, klhgG.w, klhgB.w)); // g
  easuTap(&aC, &aW, vec2f(1.0, 2.0) - pp, dir, len2, lob, clp, vec3f(zzonR.z, zzonG.z, zzonB.z)); // o
  easuTap(&aC, &aW, vec2f(0.0, 2.0) - pp, dir, len2, lob, clp, vec3f(zzonR.w, zzonG.w, zzonB.w)); // n

  // normalize and dering against the 4 nearest texels f g j k
  let f = vec3f(ijfeR.z, ijfeG.z, ijfeB.z);
  let g = vec3f(klhgR.w, klhgG.w, klhgB.w);
  let j = vec3f(ijfeR.y, ijfeG.y, ijfeB.y);
  let k = vec3f(klhgR.x, klhgG.x, klhgB.x);
  let min4 = min(min(f, g), min(j, k));
  let max4 = max(max(f, g), max(j, k));
  let pix = min(max4, max(min4, aC / aW));
  return vec4f(pix, 1.0);
}
`

/**
 * RCAS: sharpens the EASU output in place size (output size). con.x = exp2(-sharpness in stops), see FsrRcasCon.
 */
export const FSR1_RCAS_WGSL = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct RcasParams {
  con: vec4f,
};

@group(0) @binding(0) var<uniform> rcas: RcasParams;
@group(0) @binding(1) var source: texture_2d<f32>;

// the lobe limit, 0.25 - 1/16 (FSR_RCAS_LIMIT)
const RCAS_LIMIT = 0.25 - 1.0 / 16.0;

fn load(p: vec2i, size: vec2i) -> vec3f {
  return saturate(textureLoad(source, clamp(p, vec2i(0), size - 1), 0).rgb);
}

@fragment
fn fs_rcas(in: FragmentInput) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(source));
  let sp = vec2i(in.position.xy);
  //    b
  //  d e f
  //    h
  let b = load(sp + vec2i(0, -1), size);
  let d = load(sp + vec2i(-1, 0), size);
  let e = load(sp, size);
  let f = load(sp + vec2i(1, 0), size);
  let h = load(sp + vec2i(0, 1), size);

  // min and max of the ring
  let mn4 = min(min(b, d), min(f, h));
  let mx4 = max(max(b, d), max(f, h));
  // limiters, high precision reciprocals in the original. The guards keep 0/0 out where a ring is black (hitMin) or
  // white (hitMax), both are 0 there.
  let peakC = vec2f(1.0, -4.0);
  let hitMin = min(mn4, e) / max(4.0 * mx4, vec3f(1.0e-8));
  let hitMax = (peakC.x - max(mx4, e)) / min(4.0 * mn4 + peakC.y, vec3f(-1.0e-8));
  let lobeRGB = max(-hitMin, hitMax);
  let lobe = max(-RCAS_LIMIT, min(max(lobeRGB.r, max(lobeRGB.g, lobeRGB.b)), 0.0)) * rcas.con.x;

  // resolve
  let rcpL = 1.0 / (4.0 * lobe + 1.0);
  let pix = (lobe * b + lobe * d + lobe * h + lobe * f + e) * rcpL;
  return vec4f(pix, 1.0);
}
`
