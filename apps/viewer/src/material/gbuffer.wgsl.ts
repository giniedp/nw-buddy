/**
 * GBuffer encoding of the deferred pipeline.
 *
 * Follows Lumberyard's layout (CryFX/Common.cfi EncodeGBuffer/DecodeGBuffer):
 * - A (rgb10a2unorm): unsigned normal xyz (rgb, n * 0.5 + 0.5), lighting model (a, 2 bit)
 * - B (rgba8unorm):   sqrt(albedo) (rgb), occlusion (a). With the transmittance lighting model (a) holds the
 *                     transmittance luma instead and the occlusion is 1, like the game's DecodeGBuffer.
 * - C (rgba8unorm):   smoothness (r), reflectance as sqrt YCbCr (gba). With the transmittance lighting model the
 *                     chroma (ba) holds the transmittance color instead, the reflectance keeps its luma only.
 * - location 3 (r32float): linear view depth, as the forward materials write it
 *
 * The normal is stored like the game (without the best fit scaling, 10 bit xyz is precise enough), so decals blend
 * all three targets in hardware: SRC_ALPHA / ONE_MINUS_SRC_ALPHA with color mask RGB, the alpha output of each
 * target is its blend factor (SetGBufferBlending). Blended normals decode to an nlerp.
 *
 * Requires COMMON_WGSL (LIGHTINGMODEL_* constants).
 */
export const GBUFFER_WGSL = /* wgsl */ `
struct GBufferSurface {
  normal        : vec3f, // world space, normalized
  albedo        : vec3f,
  reflectance   : vec3f, // specular color (F0)
  smoothness    : f32,
  occlusion     : f32,   // material ambient occlusion
  transmittance : vec3f, // back light color, only with LIGHTINGMODEL_TRANSMITTANCE
  lightingModel : u32,
};

struct GBufferOutput {
  @location(0) a: vec4f,
  @location(1) b: vec4f,
  @location(2) c: vec4f,
  @location(3) depth: f32,
};

const GBUFFER_MIDPOINT_8_BIT: f32 = 127.0 / 255.0;

// unsigned normal encoding into [0, 1], linear so that it can be blended
fn gbufferEncodeNormal(n: vec3f) -> vec3f {
  return n * 0.5 + 0.5;
}

// decodes the rgb of GBuffer A, also blended or interpolated values
fn gbufferDecodeNormal(e: vec3f) -> vec3f {
  return normalize(e * 2.0 - 1.0);
}

// sqrt(color) as YCbCr, chroma remapped into [0, 1] (EncodeColorYCC)
fn gbufferEncodeYCC(color: vec3f) -> vec3f {
  let c = sqrt(max(color, vec3f(0.0)));
  let y  = dot(vec3f(0.299, 0.587, 0.114), c);
  let cb = dot(vec3f(-0.1687, -0.3312, 0.5), c);
  let cr = dot(vec3f(0.5, -0.4186, -0.0813), c);
  return vec3f(y, cb * GBUFFER_MIDPOINT_8_BIT + GBUFFER_MIDPOINT_8_BIT, cr * GBUFFER_MIDPOINT_8_BIT + GBUFFER_MIDPOINT_8_BIT);
}

// DecodeColorYCC
fn gbufferDecodeYCC(encoded: vec3f, useChroma: bool) -> vec3f {
  var e = vec3f(encoded.x, encoded.y / GBUFFER_MIDPOINT_8_BIT - 1.0, encoded.z / GBUFFER_MIDPOINT_8_BIT - 1.0);
  if (!useChroma) {
    e = vec3f(e.x, 0.0, 0.0);
  }
  let c = vec3f(
    e.x + 1.402 * e.z,
    dot(vec3f(1.0, -0.3441, -0.7141), e),
    e.x + 1.772 * e.y,
  );
  return c * c;
}

fn encodeGBuffer(s: GBufferSurface, linearDepth: f32) -> GBufferOutput {
  var out: GBufferOutput;
  out.a = vec4f(gbufferEncodeNormal(s.normal), f32(min(s.lightingModel, 3u)) / 3.0);
  out.b = vec4f(sqrt(max(s.albedo, vec3f(0.0))), s.occlusion);
  out.c = vec4f(s.smoothness, gbufferEncodeYCC(s.reflectance));
  if (s.lightingModel == LIGHTINGMODEL_TRANSMITTANCE) {
    let t = gbufferEncodeYCC(s.transmittance);
    out.b.a = t.x; // in place of the occlusion
    out.c = vec4f(out.c.xy, t.yz); // keeps smoothness and reflectance luma
  }
  out.depth = linearDepth;
  return out;
}

fn decodeGBuffer(a: vec4f, b: vec4f, c: vec4f) -> GBufferSurface {
  var s: GBufferSurface;
  s.lightingModel = u32(round(a.w * 3.0));
  s.normal = gbufferDecodeNormal(a.xyz);
  s.albedo = b.rgb * b.rgb;
  s.occlusion = b.a;
  s.smoothness = c.x;
  if (s.lightingModel == LIGHTINGMODEL_TRANSMITTANCE) {
    s.occlusion = 1.0;
    s.reflectance = gbufferDecodeYCC(c.yzw, false);
    s.transmittance = gbufferDecodeYCC(vec3f(b.a, c.zw), true);
  } else {
    s.reflectance = gbufferDecodeYCC(c.yzw, true);
    s.transmittance = vec3f(0.0);
  }
  return s;
}
`
