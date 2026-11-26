import {
  BufferUsage,
  type Device,
  type Texture,
  type WebGpuBuffer,
  type WebGpuDevice,
  type WebGpuTexture,
} from '@gglib/graphics'
import { BC3_ENCODE_SHADER } from './BC3Encoder.wgsl'

export interface BC3EncoderOptions {
  width: number
  height: number
}

export class BC3Encoder {
  private pipeline: any | null = null
  private device: WebGpuDevice
  private dstBuffer: WebGpuBuffer
  private paramsBuffer: WebGpuBuffer
  private params: Float32Array = new Float32Array(4)

  public constructor(device: Device, options: BC3EncoderOptions) {
    this.device = device as WebGpuDevice

    if (options.width < 1 || options.height < 1) {
      throw new Error('width and height must be at least 1')
    }
    if (options.width % 4 !== 0 || options.height % 4 !== 0) {
      throw new Error('width and height must be multiples of 4')
    }

    const blocksX = options.width / 4
    const blocksY = options.height / 4
    const blockCount = blocksX * blocksY

    // reused output buffer — sized for mip 0 (largest level)
    // smaller mips write fewer blocks but reuse the same buffer
    this.dstBuffer = this.device.createBuffer({
      name: 'bc3-encode-dst',
      size: blockCount * 16,
      usage: BufferUsage.STORAGE,
      readWrite: true,
    })
    this.paramsBuffer = this.device.createBuffer({
      name: 'bc3-encode-uniforms',
      usage: BufferUsage.UNIFORM,
      size: 4 * 4, // vec4f
    })
  }

  /**
   * Compress one mip level of src into the matching mip level of the dst array slice.
   *
   * Call once per mip level:
   *   for (let mip = 0; mip < mipCount; mip++) {
   *     encoder.encode(src, dst, layer, resolution >> mip, mip)
   *   }
   */
  public encode(
    src: Texture, // rgba8unorm bake target, must have mip levels
    src2: Texture, // source for alpha, same dimensions and mip count as src
    dst: Texture, // bc3 array texture
    layer: number, // array layer to write into
    resolution: number, // mip level dimensions (tileResolution >> mipLevel)
    mipLevel: number, // which mip level to read from src and write into dst
    rgbScale: number = 1.0, // optional scale applied to source RGB before encoding (default 1.0, no change)
    alphaSelector: null | 'r' | 'g' = null,
    sqrtEncode = false, // store sqrt(rgb), decode with x*x. keeps precision in the darks
  ): void {
    // stop encoding below 4x4 — BC3 block size minimum
    if (resolution < 4) return

    const gpu = this.device.gpu

    this.pipeline ||= gpu.createComputePipeline({
      label: 'bc3-encode',
      layout: 'auto',
      compute: {
        module: gpu.createShaderModule({ code: BC3_ENCODE_SHADER }),
        entryPoint: 'main',
      },
    })

    // update params
    this.params[0] = rgbScale
    this.params[1] = alphaSelector === 'r' ? 1.0 : alphaSelector === 'g' ? 2.0 : 0.0
    this.params[2] = sqrtEncode ? 1.0 : 0.0
    this.device.queue.writeBuffer(this.paramsBuffer.resource, 0, this.params)

    // block grid for this mip level
    const blocksX = Math.ceil(resolution / 4)
    const blocksY = Math.ceil(resolution / 4)
    const bytesPerRow = Math.ceil((blocksX * 16) / 256) * 256

    // console.log(
    //   `mip=${mipLevel} resolution=${resolution} blocksX=${blocksX} blocksY=${blocksY} bytesPerRow=${bytesPerRow} layer=${layer}`,
    // )

    const bindGroup = gpu.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: (src as WebGpuTexture).gpuObject.createView({
            dimension: '2d',
            baseMipLevel: mipLevel,
            mipLevelCount: 1,
          }),
        },
        {
          binding: 1,
          resource: (src2 as WebGpuTexture).gpuObject.createView({
            dimension: '2d',
            baseMipLevel: mipLevel,
            mipLevelCount: 1,
          }),
        },
        {
          binding: 2,
          resource: { buffer: this.paramsBuffer.resource },
        },
        {
          binding: 3,
          resource: { buffer: this.dstBuffer.resource },
        },
      ],
    })

    const encoder = gpu.createCommandEncoder({ label: `bc3-encode-mip${mipLevel}` })

    // 1. compute — encode mip level into dstBuffer
    const pass = encoder.beginComputePass({ label: `bc3-encode-mip${mipLevel}` })
    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(blocksX, blocksY, 1)
    pass.end()

    // 2. copy compressed blocks into the correct array slice + mip level
    //    width/height must be multiples of 4 for BC3
    encoder.copyBufferToTexture(
      {
        buffer: this.dstBuffer.resource,
        bytesPerRow: bytesPerRow,
        rowsPerImage: blocksY,
      },
      {
        texture: (dst as WebGpuTexture).gpuObject,
        origin: { x: 0, y: 0, z: layer },
        mipLevel: mipLevel,
      },
      {
        width: resolution,
        height: resolution,
        depthOrArrayLayers: 1,
      },
    )

    gpu.queue.submit([encoder.finish()])
  }

  public dispose(): void {
    this.dstBuffer.dispose()
  }

  public async debugDumpDecodedBC3(filename: string, device: Device, resolution: number): Promise<void> {
    const gpu = (device as WebGpuDevice).gpu
    const blocksX = Math.ceil(resolution / 4)
    const blocksY = Math.ceil(resolution / 4)
    const bytesPerRow = Math.ceil((blocksX * 16) / 256) * 256

    const readback = gpu.createBuffer({
      size: bytesPerRow * blocksY,
      usage: 8 | 1,
      // usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    })

    const encoder = gpu.createCommandEncoder()
    encoder.copyBufferToBuffer(this.dstBuffer.resource, 0, readback, 0, bytesPerRow * blocksY)
    gpu.queue.submit([encoder.finish()])

    await readback.mapAsync(1)
    const raw = new Uint32Array(readback.getMappedRange())
    const rgba = new Uint8ClampedArray(resolution * resolution * 4)

    // decode each BC3 block
    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        const blockIdx = by * blocksX + bx
        const base = blockIdx * 4
        const w = [raw[base], raw[base + 1], raw[base + 2], raw[base + 3]]

        // decode color endpoints
        const c0 = w[2] & 0xffff
        const c1 = (w[2] >>> 16) & 0xffff
        const r0 = ((c0 >> 11) & 0x1f) / 31,
          g0 = ((c0 >> 5) & 0x3f) / 63,
          b0 = (c0 & 0x1f) / 31
        const r1 = ((c1 >> 11) & 0x1f) / 31,
          g1 = ((c1 >> 5) & 0x3f) / 63,
          b1 = (c1 & 0x1f) / 31
        const cp = [
          [r0, g0, b0],
          [r1, g1, b1],
          c0 > c1
            ? [(2 * r0 + r1) / 3, (2 * g0 + g1) / 3, (2 * b0 + b1) / 3]
            : [(r0 + r1) / 2, (g0 + g1) / 2, (b0 + b1) / 2],
          c0 > c1 ? [(r0 + 2 * r1) / 3, (g0 + 2 * g1) / 3, (b0 + 2 * b1) / 3] : [0, 0, 0],
        ]

        for (let ty = 0; ty < 4; ty++) {
          for (let tx = 0; tx < 4; tx++) {
            const px = bx * 4 + tx,
              py = by * 4 + ty
            if (px >= resolution || py >= resolution) continue
            const ci = (w[3] >> ((ty * 4 + tx) * 2)) & 3
            const off = (py * resolution + px) * 4
            // apply inverse scale for visualization
            rgba[off + 0] = Math.min(255, (cp[ci][0] * 255) / 8)
            rgba[off + 1] = Math.min(255, (cp[ci][1] * 255) / 8)
            rgba[off + 2] = Math.min(255, (cp[ci][2] * 255) / 8)
            rgba[off + 3] = 255
          }
        }
      }
    }

    readback.unmap()
    readback.destroy()

    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = resolution
    canvas.getContext('2d')!.putImageData(new ImageData(rgba, resolution, resolution), 0, 0)
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
}
