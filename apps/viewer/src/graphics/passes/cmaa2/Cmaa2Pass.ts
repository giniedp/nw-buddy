import { TextureUsage, type Device, type GpuTimer, type WebGpuDevice, type WebGpuTexture } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { CMAA2_WGSL } from './Cmaa2Pass.wgsl'

export type Cmaa2Preset = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Edge thresholds of the CMAA2.hlsl presets (CMAA2_STATIC_QUALITY_PRESET), the reference default is high
 */
const PRESETS: Record<Cmaa2Preset, number> = {
  low: 0.15,
  medium: 0.1,
  high: 0.07,
  ultra: 0.05,
}

export const Cmaa2DebugModes = ['off', 'edges'] as const
export type Cmaa2DebugMode = (typeof Cmaa2DebugModes)[number]

export interface Cmaa2PassOptions {
  enabled?: boolean
  preset?: Cmaa2Preset
}

const STORAGE_USAGE = TextureUsage.RenderTarget | TextureUsage.TextureBinding | TextureUsage.StorageBinding
const PARAMS_SIZE = 32

interface WorkBuffers {
  width: number
  height: number
  edges: GPUBuffer
  shapeCandidates: GPUBuffer
  blendLocationList: GPUBuffer
  blendItemList: GPUBuffer
  blendItemListHeads: GPUBuffer
  control: GPUBuffer
  indirectArgs: GPUBuffer
  argsBindGroup: GPUBindGroup
}

interface Pipelines {
  copy: GPUComputePipeline
  edges: GPUComputePipeline
  argsProcessCandidates: GPUComputePipeline
  processCandidates: GPUComputePipeline
  argsDeferredApply: GPUComputePipeline
  deferredApply: GPUComputePipeline
  debugEdges: GPUComputePipeline
  mainLayout: GPUBindGroupLayout
  argsLayout: GPUBindGroupLayout
}

/**
 * CMAA2 (Conservative Morphological Anti-Aliasing 2.3, Intel) on the final, display encoded image, an alternative to
 * SMAA (config `antialiasing: cmaa2`). See Cmaa2Pass.wgsl.ts for the port.
 *
 * Runs as one compute pass of its own command buffer (raw WebGPU: storage buffers, atomics, indirect dispatches):
 * copy input to output, edge detection, shape candidates, deferred apply of the blended pixels into the output.
 */
export class Cmaa2Pass implements RenderPass {
  public name: string = 'CMAA2'
  public enabled = true
  public gpuTimer?: GpuTimer
  public debug: Cmaa2DebugMode = 'off'

  /**
   * Edge detection threshold (luma difference)
   */
  public threshold = PRESETS.high
  /**
   * Local contrast adaptation, edges next to stronger edges are dropped
   */
  public localContrastAdaptation = 0.1
  /**
   * Blur amount of simple (L) shapes
   */
  public simpleShapeBluriness = 0.1
  /**
   * CMAA2_EXTRA_SHARPNESS: preserves more text and shape clarity at the expense of less AA
   */
  public extraSharpness = false

  public set preset(value: Cmaa2Preset) {
    this.threshold = PRESETS[value] ?? PRESETS.high
    this.currentPreset = value
  }
  public get preset(): Cmaa2Preset {
    return this.currentPreset
  }

  private currentPreset: Cmaa2Preset = 'high'
  private device: WebGpuDevice
  private pipelines: Pipelines | null = null
  private buffers: WorkBuffers | null = null
  private paramsBuffer: GPUBuffer | null = null
  private params = new ArrayBuffer(PARAMS_SIZE)
  private isActive = false
  private source: FrameResource
  private target: FrameResource

  public constructor(device: Device, options?: Cmaa2PassOptions) {
    this.device = device as WebGpuDevice
    this.enabled = options?.enabled ?? this.enabled
    this.preset = options?.preset ?? 'high'
    device.ready.then(() => {
      this.createPipelines().catch((err) => console.error('CMAA2 pipelines not created', err))
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && !!this.pipelines
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.source = frame.read(RenderChannel.Color)
    this.target = frame.write(RenderChannel.Color, { usage: STORAGE_USAGE })
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }
    const gpu = this.device.gpu
    const pipelines = this.pipelines
    const source = this.source.texture as WebGpuTexture
    const target = this.target.texture as WebGpuTexture
    const width = target.width
    const height = target.height
    const buffers = this.getBuffers(width, height)
    this.writeParams(width, height)

    const mainBindGroup = gpu.createBindGroup({
      label: 'CMAA2',
      layout: pipelines.mainLayout,
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
        { binding: 1, resource: source.gpuObject.createView() },
        { binding: 2, resource: target.gpuObject.createView() },
        { binding: 3, resource: { buffer: buffers.edges } },
        { binding: 4, resource: { buffer: buffers.shapeCandidates } },
        { binding: 5, resource: { buffer: buffers.blendLocationList } },
        { binding: 6, resource: { buffer: buffers.blendItemList } },
        { binding: 7, resource: { buffer: buffers.blendItemListHeads } },
        { binding: 8, resource: { buffer: buffers.control } },
      ],
    })

    // everything recorded by the pipeline so far must reach the queue before this command buffer
    ctx.device.renderPass.flush()
    this.device.computePass.flush()

    const encoder = gpu.createCommandEncoder({ label: 'CMAA2' })
    const timestampWrites = this.gpuTimer ? this.device.timers.getWrites(this.gpuTimer, true) : undefined
    const pass = encoder.beginComputePass({ label: 'CMAA2', timestampWrites })
    pass.setBindGroup(0, mainBindGroup)

    pass.setPipeline(pipelines.copy)
    pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8))

    // 16x16 threads per group, each thread a 2x2 quad, the groups overlap by one quad on each side
    pass.setPipeline(pipelines.edges)
    pass.dispatchWorkgroups(Math.ceil(width / 2 / 14), Math.ceil(height / 2 / 14))

    if (this.debug === 'edges') {
      pass.setPipeline(pipelines.debugEdges)
      pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16))
      // the counters are reset by the args pass of the apply stage, still needed
      pass.setPipeline(pipelines.argsDeferredApply)
      pass.setBindGroup(1, buffers.argsBindGroup)
      pass.dispatchWorkgroups(1)
    } else {
      pass.setPipeline(pipelines.argsProcessCandidates)
      pass.setBindGroup(1, buffers.argsBindGroup)
      pass.dispatchWorkgroups(1)

      pass.setPipeline(pipelines.processCandidates)
      pass.dispatchWorkgroupsIndirect(buffers.indirectArgs, 0)

      pass.setPipeline(pipelines.argsDeferredApply)
      pass.setBindGroup(1, buffers.argsBindGroup)
      pass.dispatchWorkgroups(1)

      pass.setPipeline(pipelines.deferredApply)
      pass.dispatchWorkgroupsIndirect(buffers.indirectArgs, 0)
    }
    pass.end()
    gpu.queue.submit([encoder.finish()])
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  private writeParams(width: number, height: number) {
    const view = new DataView(this.params)
    view.setInt32(0, width, true)
    view.setInt32(4, height, true)
    view.setUint32(8, Math.ceil(width / 2), true)
    view.setUint32(12, this.extraSharpness ? 1 : 0, true)
    view.setFloat32(16, this.threshold, true)
    view.setFloat32(20, this.localContrastAdaptation, true)
    view.setFloat32(24, this.simpleShapeBluriness, true)
    view.setUint32(28, Cmaa2DebugModes.indexOf(this.debug), true)
    this.device.gpu.queue.writeBuffer(this.paramsBuffer, 0, this.params)
  }

  /**
   * Work buffers for the resolution. Capacities (3837x1956: ~68 MB):
   * - edges: 2 pixels per u32
   * - shape candidates, blend locations, list heads: one per 2x2 quad
   * - blend items: one per two pixels (simple shapes add one, Z shapes one per pixel along the line)
   */
  private getBuffers(width: number, height: number): WorkBuffers {
    if (this.buffers?.width === width && this.buffers?.height === height) {
      return this.buffers
    }
    this.destroyBuffers()
    const gpu = this.device.gpu
    const quadsX = Math.ceil(width / 2)
    const quads = quadsX * Math.ceil(height / 2)
    const storage = (label: string, size: number, usage = 0) =>
      gpu.createBuffer({ label: `CMAA2 ${label}`, size: Math.max(16, size), usage: GPUBufferUsage.STORAGE | usage })

    const blendItemListHeads = storage('blend item list heads', quads * 4, GPUBufferUsage.COPY_DST)
    // empty lists, the edge pass only clears the heads of quads with edges
    gpu.queue.writeBuffer(blendItemListHeads, 0, new Uint32Array(quads).fill(0xffffffff))
    const indirectArgs = storage('indirect args', 16, GPUBufferUsage.INDIRECT)
    const buffers: WorkBuffers = {
      width,
      height,
      edges: storage('edges', quadsX * height * 4),
      shapeCandidates: storage('shape candidates', quads * 4),
      blendLocationList: storage('blend location list', quads * 4),
      blendItemList: storage('blend item list', Math.ceil((width * height) / 2) * 8),
      blendItemListHeads,
      // zero initialized counters
      control: storage('control', 16 * 4),
      indirectArgs,
      argsBindGroup: gpu.createBindGroup({
        label: 'CMAA2 args',
        layout: this.pipelines.argsLayout,
        entries: [{ binding: 0, resource: { buffer: indirectArgs } }],
      }),
    }
    this.buffers = buffers
    return buffers
  }

  private destroyBuffers() {
    const b = this.buffers
    if (!b) {
      return
    }
    for (const buffer of [
      b.edges,
      b.shapeCandidates,
      b.blendLocationList,
      b.blendItemList,
      b.blendItemListHeads,
      b.control,
      b.indirectArgs,
    ]) {
      buffer.destroy()
    }
    this.buffers = null
  }

  private async createPipelines() {
    const gpu = this.device.gpu
    const module = gpu.createShaderModule({ label: 'CMAA2', code: CMAA2_WGSL })
    const info = await module.getCompilationInfo()
    const errors = info.messages.filter((m) => m.type === 'error')
    if (errors.length) {
      throw new Error(errors.map((m) => `${m.lineNum}:${m.linePos} ${m.message}`).join('\n'))
    }
    const compute = GPUShaderStage.COMPUTE
    const storageEntry = (binding: number): GPUBindGroupLayoutEntry => ({
      binding,
      visibility: compute,
      buffer: { type: 'storage' },
    })
    const mainLayout = gpu.createBindGroupLayout({
      label: 'CMAA2',
      entries: [
        { binding: 0, visibility: compute, buffer: { type: 'uniform' } },
        { binding: 1, visibility: compute, texture: { sampleType: 'unfilterable-float' } },
        { binding: 2, visibility: compute, storageTexture: { access: 'write-only', format: 'rgba16float' } },
        storageEntry(3),
        storageEntry(4),
        storageEntry(5),
        storageEntry(6),
        storageEntry(7),
        storageEntry(8),
      ],
    })
    // the indirect arguments are written as storage only by the args entry points, the indirect dispatches must not
    // see them bound as storage
    const argsLayout = gpu.createBindGroupLayout({ label: 'CMAA2 args', entries: [storageEntry(0)] })
    const main = gpu.createPipelineLayout({ label: 'CMAA2', bindGroupLayouts: [mainLayout] })
    const args = gpu.createPipelineLayout({ label: 'CMAA2 args', bindGroupLayouts: [mainLayout, argsLayout] })
    const pipeline = (entryPoint: string, layout: GPUPipelineLayout) =>
      gpu.createComputePipelineAsync({ label: `CMAA2 ${entryPoint}`, layout, compute: { module, entryPoint } })

    const [copy, edges, argsProcessCandidates, processCandidates, argsDeferredApply, deferredApply, debugEdges] =
      await Promise.all([
        pipeline('copyCS', main),
        pipeline('edgesCS', main),
        pipeline('argsProcessCandidatesCS', args),
        pipeline('processCandidatesCS', main),
        pipeline('argsDeferredApplyCS', args),
        pipeline('deferredColorApply2x2CS', main),
        pipeline('debugEdgesCS', main),
      ])
    this.paramsBuffer = gpu.createBuffer({
      label: 'CMAA2 params',
      size: PARAMS_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.pipelines = {
      copy,
      edges,
      argsProcessCandidates,
      processCandidates,
      argsDeferredApply,
      deferredApply,
      debugEdges,
      mainLayout,
      argsLayout,
    }
  }
}
