import {
  Buffer,
  BufferUsage,
  Device,
  Effect,
  Geometry,
  Material,
  Mesh,
  type MeshPart,
  type RenderEncoder,
  type RenderVariant,
  type WebGpuBuffer,
  type WebGpuDevice,
} from '@gglib/graphics'
import { BoundingBox, BoundingFrustum, BoundingSphere, type Mat4 } from '@gglib/math'
import { GPU_INSTANCE_CULL_SHADER } from './GpuInstanceCull.wgsl'

const INVALID = 0xffffffff
// world mat4 + info vec4u
const FLOATS_PER_RECORD = 20
const BYTES_PER_RECORD = FLOATS_PER_RECORD * 4
const BYTES_PER_MAT4 = 64
// indexCount|vertexCount, instanceCount, firstIndex|firstVertex, baseVertex|firstInstance, firstInstance|unused
const WORDS_PER_DRAW = 5
const BYTES_PER_DRAW = WORDS_PER_DRAW * 4
const PARAMS_BYTE_SIZE = 6 * 16 + 16 + 16
const WORKGROUP_SIZE = 64

export interface GpuInstanceCullOptions {
  view: Mat4
  projection: Mat4
  cameraPosition: { x: number; y: number; z: number }
  /**
   * Scale applied to the max view distance of each instance. Use 0 to ignore view distances.
   */
  viewDistanceScale: number
}

/**
 * A group of instances that share the same mesh. Each part of the mesh is one indirect draw.
 */
export interface GpuInstanceGroup {
  readonly key: string
  readonly index: number
  readonly mesh: Mesh
  instanceCount: number
}

/**
 * Renders instances of meshes with GPU culling and indirect draws.
 *
 * @remarks
 * Instances can be added and removed at any time. Each instance is a record with a world transform,
 * a group and a max view distance. Every frame a compute pass culls all records against the camera,
 * writes the visible transforms compacted per group into the output buffer and updates the indirect
 * draw arguments. Each part of each group mesh is a single drawIndexedIndirect call.
 *
 * Materials are wrapped, so that their effects are replaced with clones that read the instance transforms from
 * the output buffer. The clones opt out of the default per instance transform block, so the render list lets the
 * geometries render themselves.
 */
export class GpuInstanceBatch {
  public readonly device: WebGpuDevice
  public readonly name: string

  /**
   * The mesh that issues all draws of this batch. Is replaced when groups are added or removed.
   */
  public mesh: Mesh | null = null
  public onMeshChanged: (mesh: Mesh | null) => void = null

  private groups: GpuInstanceGroup[] = []
  private groupByKey = new Map<string, GpuInstanceGroup>()
  private freeGroups: number[] = []
  private groupData = new Float32Array(0)

  private records = new Float32Array(0)
  private recordsU32 = new Uint32Array(0)
  private recordCapacity = 0
  private recordCount = 0
  /**
   * Records below this index have been used at least once, records above are unused
   */
  private recordTop = 0
  private freeRecords: number[] = []
  private dirtyMin = Infinity
  private dirtyMax = -Infinity

  private recordBuffer: Buffer | null = null
  private groupBuffer: Buffer | null = null
  private outputBuffer: Buffer | null = null
  private counterBuffer: Buffer | null = null
  private offsetBuffer: Buffer | null = null
  private slotBuffer: Buffer | null = null
  private drawBuffer: Buffer | null = null
  private argsBuffer: Buffer | null = null
  private paramsBuffer: Buffer
  private bindGroup: GPUBindGroup | null = null

  private drawCount = 0
  private drawsDirty = false
  private groupsDirty = false

  private effects = new Map<Effect, Effect>()
  private materialProxies = new Map<Material, Material>()
  private params = new Float32Array(PARAMS_BYTE_SIZE / 4)
  private paramsU32 = new Uint32Array(this.params.buffer)
  private frustum = new BoundingFrustum()

  public get instanceCount() {
    return this.recordCount
  }

  public get groupCount() {
    return this.groupByKey.size
  }

  public constructor(device: Device, name: string) {
    this.device = device as WebGpuDevice
    this.name = name
    this.paramsBuffer = this.createBuffer('params', PARAMS_BYTE_SIZE, BufferUsage.UNIFORM)
    this.growRecords(1024)
    this.growGroups(64)
  }

  /**
   * Checks whether all parts of the mesh can be rendered by the batch
   */
  public canRender(mesh: Mesh) {
    for (const part of mesh.parts) {
      const material = mesh.materials[part.materialIndex]
      const geometry = mesh.geometries[part.geometryIndex]
      if (!material || !geometry || material.noRender) {
        continue
      }
      if (material.isTransparent) {
        return false
      }
      if (!material.primaryEffect?.program.perInstanceTransformBlock) {
        return false
      }
    }
    return true
  }

  /**
   * Gets or creates the group for the given mesh
   *
   * @param key - unique key of the mesh, e.g. model url and node index
   * @param mesh - the mesh to render
   */
  public getGroup(key: string, mesh: Mesh): GpuInstanceGroup {
    let group = this.groupByKey.get(key)
    if (group) {
      return group
    }
    const index = this.freeGroups.length ? this.freeGroups.pop() : this.groups.length
    group = { key, index, mesh, instanceCount: 0 }
    this.groups[index] = group
    this.groupByKey.set(key, group)
    if (index >= this.groupData.length / 4) {
      this.growGroups(Math.max(64, (index + 1) * 2))
    }
    const sphere = mesh.boundingSphere || BoundingSphere.createFromBox(mesh.boundingBox || BoundingBox.create())
    this.groupData[index * 4 + 0] = sphere.center.x
    this.groupData[index * 4 + 1] = sphere.center.y
    this.groupData[index * 4 + 2] = sphere.center.z
    this.groupData[index * 4 + 3] = sphere.radius
    this.groupsDirty = true
    this.drawsDirty = true
    return group
  }

  /**
   * Adds an instance and returns its handle
   *
   * @param group - the group to render the instance with
   * @param world - world transform of the instance
   * @param maxViewDistance - max distance to the camera, 0 for unlimited
   */
  public addInstance(group: GpuInstanceGroup, world: Mat4, maxViewDistance: number): number {
    if (!this.freeRecords.length && this.recordTop >= this.recordCapacity) {
      this.growRecords(this.recordCapacity * 2)
    }
    const handle = this.freeRecords.length ? this.freeRecords.pop() : this.recordTop++
    this.recordCount++
    group.instanceCount++
    const offset = handle * FLOATS_PER_RECORD
    for (let i = 0; i < 16; i++) {
      this.records[offset + i] = world[i]
    }
    this.recordsU32[offset + 16] = group.index
    this.records[offset + 17] = maxViewDistance || 0
    this.markDirty(handle)
    return handle
  }

  /**
   * Updates the world transform of an instance
   */
  public updateInstance(handle: number, world: Mat4) {
    const offset = handle * FLOATS_PER_RECORD
    for (let i = 0; i < 16; i++) {
      this.records[offset + i] = world[i]
    }
    this.markDirty(handle)
  }

  /**
   * Removes an instance. The group is released when it has no instances left.
   */
  public removeInstance(handle: number) {
    const offset = handle * FLOATS_PER_RECORD
    const groupIndex = this.recordsU32[offset + 16]
    const group = groupIndex === INVALID ? null : this.groups[groupIndex]
    if (!group) {
      return
    }
    this.recordsU32[offset + 16] = INVALID
    this.freeRecords.push(handle)
    this.recordCount--
    this.markDirty(handle)

    group.instanceCount--
    if (group.instanceCount <= 0) {
      this.groupByKey.delete(group.key)
      this.groups[group.index] = null
      this.freeGroups.push(group.index)
      this.drawsDirty = true
    }
  }

  /**
   * Uploads pending changes, culls all instances against the given camera and updates the indirect draw arguments
   */
  public cull(options: GpuInstanceCullOptions) {
    this.flush()
    if (!this.drawCount) {
      return
    }

    const pipelines = getPipelines(this.device)
    this.bindGroup ||= this.device.gpu.createBindGroup({
      label: `${this.name} cull`,
      layout: pipelines.layout,
      entries: [
        this.paramsBuffer,
        this.recordBuffer,
        this.groupBuffer,
        this.outputBuffer,
        this.counterBuffer,
        this.offsetBuffer,
        this.slotBuffer,
        this.drawBuffer,
        this.argsBuffer,
      ].map((buffer, binding) => ({ binding, resource: { buffer: (buffer as WebGpuBuffer).resource } })),
    })

    this.frustum.updateFromViewProjection(options.view, options.projection)
    const p = this.params
    const u = this.paramsU32
    for (let i = 0; i < 6; i++) {
      const plane = this.frustum.planes[i]
      p[i * 4 + 0] = plane.x
      p[i * 4 + 1] = plane.y
      p[i * 4 + 2] = plane.z
      p[i * 4 + 3] = plane.w
    }
    p[24] = options.cameraPosition.x
    p[25] = options.cameraPosition.y
    p[26] = options.cameraPosition.z
    p[27] = options.viewDistanceScale
    u[28] = this.recordTop
    u[29] = this.groups.length
    u[30] = this.drawCount
    u[31] = 0
    this.paramsBuffer.setSubData(0, p)

    const encoder = this.device.gpu.createCommandEncoder({ label: `${this.name} cull` })
    const pass = encoder.beginComputePass({ label: `${this.name} cull` })
    pass.setBindGroup(0, this.bindGroup)
    pass.setPipeline(pipelines.reset)
    pass.dispatchWorkgroups(Math.ceil(this.groups.length / WORKGROUP_SIZE))
    pass.setPipeline(pipelines.cull)
    pass.dispatchWorkgroups(Math.ceil(this.recordTop / WORKGROUP_SIZE))
    pass.setPipeline(pipelines.scan)
    pass.dispatchWorkgroups(1)
    pass.setPipeline(pipelines.scatter)
    pass.dispatchWorkgroups(Math.ceil(this.recordTop / WORKGROUP_SIZE))
    pass.setPipeline(pipelines.finalize)
    pass.dispatchWorkgroups(Math.ceil(this.drawCount / WORKGROUP_SIZE))
    pass.end()
    this.device.gpu.queue.submit([encoder.finish()])
  }

  public getArgsBuffer() {
    return this.argsBuffer
  }

  private markDirty(handle: number) {
    this.dirtyMin = Math.min(this.dirtyMin, handle)
    this.dirtyMax = Math.max(this.dirtyMax, handle + 1)
  }

  private flush() {
    if (this.dirtyMin < this.dirtyMax) {
      this.recordBuffer.setSubData(
        this.dirtyMin * BYTES_PER_RECORD,
        this.records,
        this.dirtyMin * FLOATS_PER_RECORD,
        (this.dirtyMax - this.dirtyMin) * FLOATS_PER_RECORD,
      )
      this.dirtyMin = Infinity
      this.dirtyMax = -Infinity
    }
    if (this.groupsDirty) {
      this.groupsDirty = false
      this.groupBuffer.setSubData(0, this.groupData)
    }
    if (this.drawsDirty) {
      this.drawsDirty = false
      this.rebuildDraws()
    }
  }

  /**
   * Rebuilds the draw arguments and the mesh from the current groups
   */
  private rebuildDraws() {
    const args: number[] = []
    const draws: number[] = []
    const geometries: Geometry[] = []
    const materials: Material[] = []
    const parts: MeshPart[] = []
    const materialIndex = new Map<Material, number>()

    for (const group of this.groups) {
      if (!group) {
        continue
      }
      const mesh = group.mesh
      for (const part of mesh.parts) {
        const geometry = mesh.geometries[part.geometryIndex]
        const material = mesh.materials[part.materialIndex]
        if (!geometry || !material || material.noRender) {
          continue
        }
        const drawIndex = draws.length / 2
        if (geometry.indexBuffer) {
          args.push(geometry.indexCount, 0, geometry.indexOffset ?? 0, (geometry.baseVertex ?? 0) >>> 0, 0)
          draws.push(group.index, drawIndex * WORDS_PER_DRAW + 4)
        } else {
          args.push(geometry.vertexCount, 0, geometry.vertexOffset ?? 0, 0, 0)
          draws.push(group.index, drawIndex * WORDS_PER_DRAW + 3)
        }

        const proxy = this.getMaterial(material)
        if (!materialIndex.has(proxy)) {
          materialIndex.set(proxy, materials.length)
          materials.push(proxy)
        }
        parts.push({ geometryIndex: geometries.length, materialIndex: materialIndex.get(proxy) })
        geometries.push(new IndirectGeometry(this.device, geometry, this, drawIndex))
      }
    }

    this.drawCount = draws.length / 2
    const capacity = Math.max(64, this.drawCount)
    if (!this.argsBuffer || this.argsBuffer.size < capacity * BYTES_PER_DRAW) {
      this.argsBuffer?.dispose()
      this.drawBuffer?.dispose()
      const size = capacity * 2
      this.argsBuffer = this.createBuffer(
        'args',
        size * BYTES_PER_DRAW,
        BufferUsage.STORAGE | BufferUsage.INDIRECT,
        true,
      )
      this.drawBuffer = this.createBuffer('draws', size * 8, BufferUsage.STORAGE)
      this.bindGroup = null
    }
    if (this.drawCount) {
      this.argsBuffer.setSubData(0, new Uint32Array(args))
      this.drawBuffer.setSubData(0, new Uint32Array(draws))
    }

    // the geometries are recreated with every mesh, the previous mesh releases them
    const previous = this.mesh
    this.mesh = parts.length
      ? new Mesh(this.device, {
          name: this.name,
          geometries,
          materials,
          parts,
          boundingBox: BoundingBox.create(-1e6, -1e6, -1e6, 1e6, 1e6, 1e6),
          boundingSphere: BoundingSphere.create(0, 0, 0, 1e6),
        })
      : null
    this.onMeshChanged?.(this.mesh)
    previous?.dispose()
  }

  private growRecords(capacity: number) {
    const records = new Float32Array(capacity * FLOATS_PER_RECORD)
    records.set(this.records)
    const recordsU32 = new Uint32Array(records.buffer)
    for (let i = this.recordCapacity; i < capacity; i++) {
      recordsU32[i * FLOATS_PER_RECORD + 16] = INVALID
    }
    this.records = records
    this.recordsU32 = recordsU32
    this.recordCapacity = capacity

    this.recordBuffer?.dispose()
    this.outputBuffer?.dispose()
    this.slotBuffer?.dispose()
    this.recordBuffer = this.createBuffer('records', capacity * BYTES_PER_RECORD, BufferUsage.STORAGE)
    this.outputBuffer = this.createBuffer('output', capacity * BYTES_PER_MAT4, BufferUsage.STORAGE, true)
    this.slotBuffer = this.createBuffer('slots', capacity * 4, BufferUsage.STORAGE, true)
    this.dirtyMin = 0
    this.dirtyMax = Math.max(1, this.recordTop)
    this.bindGroup = null
    for (const [source, clone] of this.effects) {
      if (clone) {
        clone.program.mustGet(source.program.perInstanceTransformBlock).setBuffer(this.outputBuffer)
      }
    }
  }

  private growGroups(capacity: number) {
    const data = new Float32Array(capacity * 4)
    data.set(this.groupData)
    this.groupData = data
    this.groupBuffer?.dispose()
    this.counterBuffer?.dispose()
    this.offsetBuffer?.dispose()
    this.groupBuffer = this.createBuffer('groups', capacity * 16, BufferUsage.STORAGE)
    this.counterBuffer = this.createBuffer('counters', capacity * 4, BufferUsage.STORAGE, true)
    this.offsetBuffer = this.createBuffer('offsets', capacity * 4, BufferUsage.STORAGE, true)
    this.groupsDirty = true
    this.bindGroup = null
  }

  /**
   * Wraps the material so that it hands out effects which read the instance transforms from the output buffer.
   * The wrapper shares all other state with the original material.
   */
  private getMaterial(material: Material): Material {
    let result = this.materialProxies.get(material)
    if (!result) {
      result = Object.create(material) as Material
      result.getEffect = (variant: RenderVariant) => this.getEffect(material.getEffect(variant))
      this.materialProxies.set(material, result)
    }
    return result
  }

  private getEffect(effect: Effect | null): Effect | null {
    if (!effect) {
      return null
    }
    if (this.effects.has(effect)) {
      return this.effects.get(effect)
    }
    const options = effect.cloneOptions()
    const transformBlock = options.program.perInstanceTransformBlock
    if (!transformBlock) {
      // effect does not read instance transforms from a buffer, can't be used for instancing
      this.effects.set(effect, null)
      return null
    }
    const clone = new Effect(this.device, {
      ...options,
      program: {
        ...options.program,
        // opt out of render list batching, instance transforms are provided by the output buffer
        perInstanceTransformBlock: null,
      },
    })
    clone.program.mustGet(transformBlock).setBuffer(this.outputBuffer)
    this.effects.set(effect, clone)
    return clone
  }

  private createBuffer(name: string, size: number, usage: number, readWrite = false) {
    return this.device.createBuffer({ name: `${this.name} ${name}`, size: Math.max(16, size), usage, readWrite })
  }

  public dispose() {
    for (const effect of this.effects.values()) {
      effect?.dispose()
    }
    this.effects.clear()
    this.materialProxies.clear()
    this.mesh?.dispose()
    this.mesh = null
    for (const buffer of [
      this.recordBuffer,
      this.groupBuffer,
      this.outputBuffer,
      this.counterBuffer,
      this.offsetBuffer,
      this.slotBuffer,
      this.drawBuffer,
      this.argsBuffer,
      this.paramsBuffer,
    ]) {
      buffer?.dispose()
    }
  }
}

/**
 * Shares the vertex and index buffers of the source geometry and renders with indirect draw arguments
 */
class IndirectGeometry extends Geometry {
  private batch: GpuInstanceBatch
  private drawIndex: number

  public constructor(device: Device, source: Geometry, batch: GpuInstanceBatch, drawIndex: number) {
    super(device, {
      name: source.name,
      boundingBox: source.boundingBox,
      boundingSphere: source.boundingSphere,
      primitiveType: source.primitiveType,
      indexBuffer: source.indexBuffer,
      vertexBuffer: source.vertexBuffer,
      indexOffset: source.indexOffset,
      indexCount: source.indexCount,
      vertexOffset: source.vertexOffset,
      vertexCount: source.vertexCount,
      baseVertex: source.baseVertex,
    })
    this.batch = batch
    this.drawIndex = drawIndex
  }

  public override render(encoder: RenderEncoder): void {
    if (this.indexBuffer) {
      encoder.setIndexBuffer(this.indexBuffer)
    }
    encoder.setVertexBuffer(this.vertexBuffer)
    encoder.setPrimitiveType(this.primitiveType)
    if (this.indexBuffer) {
      encoder.drawIndexedIndirect(this.batch.getArgsBuffer(), this.drawIndex * BYTES_PER_DRAW)
    } else {
      encoder.drawIndirect(this.batch.getArgsBuffer(), this.drawIndex * BYTES_PER_DRAW)
    }
  }

  public override dispose(): void {
    // buffers are owned by the source geometry
  }
}

interface CullPipelines {
  layout: GPUBindGroupLayout
  reset: GPUComputePipeline
  cull: GPUComputePipeline
  scan: GPUComputePipeline
  scatter: GPUComputePipeline
  finalize: GPUComputePipeline
}

// GPUShaderStage.COMPUTE
const SHADER_STAGE_COMPUTE = 0x4
const pipelineCache = new WeakMap<WebGpuDevice, CullPipelines>()
function getPipelines(device: WebGpuDevice): CullPipelines {
  let result = pipelineCache.get(device)
  if (result) {
    return result
  }
  const gpu = device.gpu
  if (!gpu.features.has('indirect-first-instance')) {
    console.warn('GPU instancing requires the indirect-first-instance feature, instances will not render correctly')
  }
  const types: GPUBufferBindingType[] = [
    'uniform',
    'read-only-storage',
    'read-only-storage',
    'storage',
    'storage',
    'storage',
    'storage',
    'read-only-storage',
    'storage',
  ]
  const layout = gpu.createBindGroupLayout({
    label: 'gpu instance cull',
    entries: types.map((type, binding) => ({ binding, visibility: SHADER_STAGE_COMPUTE, buffer: { type } })),
  })
  const pipelineLayout = gpu.createPipelineLayout({ label: 'gpu instance cull', bindGroupLayouts: [layout] })
  const module = gpu.createShaderModule({ label: 'gpu instance cull', code: GPU_INSTANCE_CULL_SHADER })
  const create = (entryPoint: string) =>
    gpu.createComputePipeline({
      label: `gpu instance ${entryPoint}`,
      layout: pipelineLayout,
      compute: { module, entryPoint },
    })
  result = {
    layout,
    reset: create('reset'),
    cull: create('cull'),
    scan: create('scan'),
    scatter: create('scatter'),
    finalize: create('finalize'),
  }
  pipelineCache.set(device, result)
  return result
}
