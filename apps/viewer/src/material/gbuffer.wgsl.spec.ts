/// <reference types="@webgpu/types" />
import { describe, expect, it } from 'vitest'
import { GBUFFER_WGSL } from './gbuffer.wgsl'

// round trip of encodeGBuffer → target precision → decodeGBuffer on the GPU
// A is rgb10a2unorm, B and C are rgba8unorm
const SHADER = /* wgsl */ `
const LIGHTINGMODEL_STANDARD:      u32 = 0u;
const LIGHTINGMODEL_TRANSMITTANCE: u32 = 1u;
${GBUFFER_WGSL}

struct Sample {
  normal: vec4f,        // xyz, w = lighting model
  albedo: vec4f,        // rgb, a = occlusion
  reflectance: vec4f,   // rgb, a = smoothness
  transmittance: vec4f, // rgb
};

@group(0) @binding(0) var<storage, read> inputs: array<Sample>;
@group(0) @binding(1) var<storage, read_write> outputs: array<Sample>;

fn q(v: f32, bits: f32) -> f32 {
  let m = exp2(bits) - 1.0;
  return round(saturate(v) * m) / m;
}
fn q4(v: vec4f, bits: vec4f) -> vec4f {
  return vec4f(q(v.x, bits.x), q(v.y, bits.y), q(v.z, bits.z), q(v.w, bits.w));
}

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  let input = inputs[i];
  var s: GBufferSurface;
  s.normal = normalize(input.normal.xyz);
  s.lightingModel = u32(input.normal.w);
  s.albedo = input.albedo.rgb;
  s.occlusion = input.albedo.a;
  s.reflectance = input.reflectance.rgb;
  s.smoothness = input.reflectance.a;
  s.transmittance = input.transmittance.rgb;

  let e = encodeGBuffer(s, 1.0);
  let d = decodeGBuffer(q4(e.a, vec4f(10.0, 10.0, 10.0, 2.0)), q4(e.b, vec4f(8.0)), q4(e.c, vec4f(8.0)));

  outputs[i].normal = vec4f(d.normal, f32(d.lightingModel));
  outputs[i].albedo = vec4f(d.albedo, d.occlusion);
  outputs[i].reflectance = vec4f(d.reflectance, d.smoothness);
  outputs[i].transmittance = vec4f(d.transmittance, 0.0);
}
`

interface Sample {
  normal: [number, number, number]
  model: 0 | 1
  albedo: [number, number, number]
  occlusion: number
  reflectance: [number, number, number]
  smoothness: number
  transmittance: [number, number, number]
}

async function roundTrip(samples: Sample[]): Promise<Float32Array> {
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter!.requestDevice()
  const module = device.createShaderModule({ code: SHADER })
  const info = await module.getCompilationInfo()
  const errors = info.messages.filter((m) => m.type === 'error')
  if (errors.length) {
    throw new Error(errors.map((m) => `${m.lineNum}:${m.linePos} ${m.message}`).join('\n'))
  }
  const data = new Float32Array(samples.length * 16)
  samples.forEach((s, i) => {
    data.set(
      [...s.normal, s.model, ...s.albedo, s.occlusion, ...s.reflectance, s.smoothness, ...s.transmittance, 0],
      i * 16,
    )
  })
  const input = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  const output = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC })
  const read = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST })
  device.queue.writeBuffer(input, 0, data)
  const pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: input } },
      { binding: 1, resource: { buffer: output } },
    ],
  })
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginComputePass()
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(samples.length)
  pass.end()
  encoder.copyBufferToBuffer(output, 0, read, 0, data.byteLength)
  device.queue.submit([encoder.finish()])
  await read.mapAsync(GPUMapMode.READ)
  const result = new Float32Array(read.getMappedRange().slice(0))
  device.destroy()
  return result
}

function normalize(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}

function angleDeg(a: number[], b: number[]) {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  return (Math.acos(dot) * 180) / Math.PI
}

// 10 bit unsigned xyz normals with plain rounding: up to ~0.1° (200k random normals, plan 7.1)
const MAX_NORMAL_ERROR_DEG = 0.12

const NORMALS: Array<[number, number, number]> = [
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [0, -1, 0],
  [0.3, -0.5, 0.81],
  [-0.7, 0.2, -0.68],
  [0.577, 0.577, -0.577],
  [-0.01, 0.02, -0.9997],
]

describe('GBuffer encoding', () => {
  it('round trips the standard lighting model', async () => {
    const samples: Sample[] = NORMALS.map((n, i) => ({
      normal: normalize(n),
      model: 0,
      albedo: [0.8, 0.4 * (i / NORMALS.length), 0.05],
      occlusion: 0.75,
      reflectance: [0.04, 0.05, 0.9],
      smoothness: 0.6,
      transmittance: [0, 0, 0],
    }))
    const out = await roundTrip(samples)
    samples.forEach((s, i) => {
      const o = Array.from(out.subarray(i * 16, i * 16 + 16))
      expect(angleDeg(s.normal, o.slice(0, 3))).toBeLessThan(MAX_NORMAL_ERROR_DEG)
      expect(o[3]).toBe(0)
      // sqrt encoded 8 bit albedo
      for (let c = 0; c < 3; c++) {
        expect(Math.abs(o[4 + c] - s.albedo[c])).toBeLessThan(0.01)
      }
      expect(Math.abs(o[7] - s.occlusion)).toBeLessThan(1 / 255 + 1e-6)
      // YCbCr 8 bit reflectance, chroma included
      for (let c = 0; c < 3; c++) {
        expect(Math.abs(o[8 + c] - s.reflectance[c])).toBeLessThan(0.02)
      }
      expect(Math.abs(o[11] - s.smoothness)).toBeLessThan(1 / 255 + 1e-6)
      expect(o.slice(12, 15)).toEqual([0, 0, 0])
    })
  })

  it('round trips the transmittance lighting model', async () => {
    const samples: Sample[] = NORMALS.map((n) => ({
      normal: normalize(n),
      model: 1,
      albedo: [0.2, 0.5, 0.1],
      occlusion: 0.5, // ignored, decoded as 1
      reflectance: [0.04, 0.04, 0.04],
      smoothness: 0.3,
      transmittance: [0.3, 0.6, 0.05],
    }))
    const out = await roundTrip(samples)
    samples.forEach((s, i) => {
      const o = Array.from(out.subarray(i * 16, i * 16 + 16))
      expect(angleDeg(s.normal, o.slice(0, 3))).toBeLessThan(MAX_NORMAL_ERROR_DEG)
      expect(o[3]).toBe(1)
      // reflectance keeps its luma only (gray specular), like Lumberyard
      const luma = 0.04
      for (let c = 0; c < 3; c++) {
        expect(Math.abs(o[8 + c] - luma)).toBeLessThan(0.01)
      }
      // the occlusion is 1 with the transmittance model, B.a holds the transmittance luma
      expect(o[7]).toBe(1)
      // transmittance color from the 8 bit luma and chroma
      for (let c = 0; c < 3; c++) {
        expect(Math.abs(o[12 + c] - s.transmittance[c])).toBeLessThan(0.02)
      }
    })
  })
})
