import {
  Buffer,
  BufferUsage,
  Device,
  Geometry,
  Material,
  Mesh,
  type MeshPart,
  ResourceScope,
  type WebGpuBuffer,
  type WebGpuDevice,
} from '@gglib/graphics'
import {
  BoundingBox,
  BoundingFrustum,
  BoundingSphere,
  mat4$initFromArray,
  mat4$initIdentity,
  mat4Identity,
  type Mat4,
} from '@gglib/math'
import type { Model } from '@gglib/model'
import { IMPOSTOR_FADE_RANGE, IMPOSTOR_VISIBILITY_START } from '../../constants'
import { setDitherFadeConstants } from '../../material'
import { DISTRIBUTION_CULL_SHADER } from './DistributionCull.wgsl'
import { BYTES_PER_DRAW, indirectDrawArgs, IndirectGeometry, IndirectMaterials, WORDS_PER_DRAW } from './IndirectDraw'
import { unpackRotation, type DistributionCell, type DistributionData } from './parseDistribution'

const FLOATS_PER_MAT4 = 16
const BYTES_PER_MAT4 = FLOATS_PER_MAT4 * 4
// node mat4 + sphere vec4 + info vec4u
const BYTES_PER_GROUP = BYTES_PER_MAT4 + 16 + 16
const PARAMS_BYTE_SIZE = 6 * 16 + 16 + 16 + 16
const WORKGROUP_SIZE = 64

export interface DistributionPlacement {
  /**
   * World position of the region origin
   */
  originX: number
  originY: number
  regionSize: number
  cellSize: number
  /**
   * Region heightmap, row major with flipped y axis
   */
  heightmap: Uint16Array
  mountainHeight: number
}

export interface DistributionCullOptions {
  view: Mat4
  projection: Mat4
  cameraPosition: { x: number; y: number; z: number }
  /**
   * Instances in cells further away than this are not rendered (impostors take over)
   */
  visibleDistance: number
  /**
   * Scale applied to the max view distance of each mesh. Use 0 to ignore view distances.
   */
  viewDistanceScale: number
}

export type DistributionGroupState = 'idle' | 'loading' | 'ready' | 'empty'

/**
 * A group is a unique model and material combination. All instances of a group are rendered
 * with one indirect draw per model mesh part.
 */
export interface DistributionGroup {
  index: number
  model: string
  material: string
  /**
   * First record of this group, also the first instance in the output buffer
   */
  recordStart: number
  recordCount: number
  state: DistributionGroupState
}

/**
 * GPU driven rendering of a region distribution.
 *
 * @remarks
 * Each mesh of each distribution instance becomes a record with a world transform. Records are sorted by group
 * (model + material). A compute pass culls the records against the camera every frame and writes the visible
 * transforms compacted per group into the output buffer. It also writes the instance counts into indirect draw
 * arguments, so each mesh part of each group is a single drawIndexedIndirect call, independent of the number of
 * visible cells.
 *
 * Materials are wrapped, so that their effects are replaced with clones that read the instance transforms from
 * the output buffer. The clones opt out of the default per instance transform block, so the render list lets the
 * geometries render themselves.
 */
export class DistributionBatch {
  public readonly device: WebGpuDevice
  public readonly data: DistributionData
  public readonly groups: DistributionGroup[] = []
  private groupByKey = new Map<string, DistributionGroup>()
  public readonly recordCount: number

  /**
   * Emitted with the new mesh whenever draws are added
   */
  public onMeshChanged: (mesh: Mesh) => void = null

  private recordBuffer: Buffer
  private recordInfoBuffer: Buffer
  private groupBuffer: Buffer
  private outputBuffer: Buffer
  private counterBuffer: Buffer
  private paramsBuffer: Buffer
  private drawBuffer: Buffer | null = null
  private argsBuffer: Buffer | null = null
  private bindGroup: GPUBindGroup | null = null

  /**
   * group index per draw
   */
  private drawGroups: number[] = []
  /**
   * static indirect arguments, instance counts are written by the compute pass
   */
  private drawArgs: number[] = []
  private drawCapacity = 0

  /**
   * Owns the indirect geometries, which are reused by every mesh, and the current mesh
   */
  private scope: ResourceScope
  private mesh: Mesh | null = null
  private geometries: Geometry[] = []
  private materials: Material[] = []
  private parts: MeshPart[] = []
  private materialIndex = new Map<Material, number>()

  private indirectMaterials: IndirectMaterials
  private params = new Float32Array(PARAMS_BYTE_SIZE / 4)
  private paramsU32 = new Uint32Array(this.params.buffer)
  private frustum = new BoundingFrustum()
  private placement: DistributionPlacement

  public get hasDraws() {
    return this.drawGroups.length > 0
  }

  public constructor(device: Device, data: DistributionData, placement: DistributionPlacement) {
    this.device = device as WebGpuDevice
    this.scope = device.createScope(`distribution batch r_${data.header.region[0]}_${data.header.region[1]}`)
    this.data = data
    this.placement = placement

    const header = data.header
    const name = `distribution r_${header.region[0]}_${header.region[1]}`

    // group per unique model + material
    const groupByKey = this.groupByKey
    const meshGroup = header.types.map((type) => {
      return type.meshes.map((mesh) => {
        const model = header.models[mesh.model]
        const material = header.materials[mesh.material]
        const key = `${model}|${material}`
        if (!groupByKey.has(key)) {
          const group: DistributionGroup = {
            index: this.groups.length,
            model,
            material,
            recordStart: 0,
            recordCount: 0,
            state: 'idle',
          }
          groupByKey.set(key, group)
          this.groups.push(group)
        }
        return groupByKey.get(key)
      })
    })

    // count records per group and assign ranges
    for (let i = 0; i < data.types.length; i++) {
      for (const group of meshGroup[data.types[i]]) {
        group.recordCount++
      }
    }
    let recordCount = 0
    for (const group of this.groups) {
      group.recordStart = recordCount
      recordCount += group.recordCount
    }
    this.recordCount = recordCount

    // write records sorted by group
    const records = new Float32Array(recordCount * FLOATS_PER_MAT4)
    const recordInfo = new Uint32Array(recordCount * 2)
    const recordInfoF32 = new Float32Array(recordInfo.buffer)
    const cursor = this.groups.map((it) => it.recordStart)
    const local = mat4Identity()
    for (const cell of data.cells) {
      for (const run of cell.runs) {
        const meshes = header.types[run.type].meshes
        for (let m = 0; m < meshes.length; m++) {
          const mesh = meshes[m]
          const group = meshGroup[run.type][m]
          if (mesh.transform) {
            mat4$initFromArray(local, mesh.transform)
          } else {
            mat4$initIdentity(local)
          }
          for (let i = 0; i < run.count; i++) {
            const index = data.order[run.start + i]
            const record = cursor[group.index]++
            writeRecord(records, record * FLOATS_PER_MAT4, data, index, local, placement)
            recordInfo[record * 2] = group.index | (cell.index << 16)
            recordInfoF32[record * 2 + 1] = mesh.maxViewDistance || 0
          }
        }
      }
    }

    this.recordBuffer = this.createBuffer(`${name} records`, records.byteLength, BufferUsage.STORAGE)
    this.recordBuffer.setSubData(0, records)
    this.recordInfoBuffer = this.createBuffer(`${name} record info`, recordInfo.byteLength, BufferUsage.STORAGE)
    this.recordInfoBuffer.setSubData(0, recordInfo)
    this.groupBuffer = this.createBuffer(`${name} groups`, this.groups.length * BYTES_PER_GROUP, BufferUsage.STORAGE)
    this.groupBuffer.setSubData(0, new Uint8Array(this.groups.length * BYTES_PER_GROUP))
    this.outputBuffer = this.createBuffer(`${name} output`, records.byteLength, BufferUsage.STORAGE, true)
    this.counterBuffer = this.createBuffer(`${name} counters`, this.groups.length * 4, BufferUsage.STORAGE, true)
    this.paramsBuffer = this.createBuffer(`${name} params`, PARAMS_BYTE_SIZE, BufferUsage.UNIFORM)

    const constants = {}
    setDitherFadeConstants(constants, {
      mode: 'out',
      start: IMPOSTOR_VISIBILITY_START - IMPOSTOR_FADE_RANGE,
      end: IMPOSTOR_VISIBILITY_START,
    })

    this.indirectMaterials = new IndirectMaterials(this.device, this.outputBuffer, constants)
  }

  /**
   * Returns the groups that are required to render the given cell
   */
  public cellGroups(cell: DistributionCell): DistributionGroup[] {
    const header = this.data.header
    const result = new Set<DistributionGroup>()
    for (const run of cell.runs) {
      for (const mesh of header.types[run.type].meshes) {
        const group = this.groupByKey.get(`${header.models[mesh.model]}|${header.materials[mesh.material]}`)
        if (group) {
          result.add(group)
        }
      }
    }
    return [...result]
  }

  /**
   * Enables rendering of a group once its model is loaded
   */
  public enableGroup(group: DistributionGroup, model: Model | null) {
    if (group.state === 'ready' || group.state === 'empty') {
      return
    }

    let node: Mat4 = null
    const bounds = BoundingBox.create()
    let hasBounds = false
    let hasParts = false
    for (const sceneNode of model?.sceneNodes || []) {
      const source = model.meshes[sceneNode.data?.mesh]
      if (!source) {
        continue
      }
      if (node && !mat4Equals(node, sceneNode.world)) {
        console.warn('distribution model has multiple mesh nodes with different transforms', group.model)
        continue
      }
      node = sceneNode.world
      if (source.boundingBox) {
        if (hasBounds) {
          BoundingBox.merge(bounds, source.boundingBox, bounds)
        } else {
          bounds.initFrom(source.boundingBox)
          hasBounds = true
        }
      }
      for (const part of source.parts) {
        if (this.addDraw(group, source.geometries[part.geometryIndex], source.materials[part.materialIndex])) {
          hasParts = true
        }
      }
    }

    if (!hasParts) {
      group.state = 'empty'
      return
    }
    group.state = 'ready'

    const sphere = hasBounds ? BoundingSphere.createFromBox(bounds) : new BoundingSphere(0, 0, 0, 1)
    const data = new ArrayBuffer(BYTES_PER_GROUP)
    const f32 = new Float32Array(data)
    const u32 = new Uint32Array(data)
    for (let i = 0; i < 16; i++) {
      f32[i] = node ? node[i] : IDENTITY[i]
    }
    f32[16] = sphere.center.x
    f32[17] = sphere.center.y
    f32[18] = sphere.center.z
    f32[19] = sphere.radius
    u32[20] = 1
    u32[21] = group.recordStart
    this.groupBuffer.setSubData(group.index * BYTES_PER_GROUP, data)

    const previous = this.mesh
    this.mesh = this.scope.adopt(this.createMesh())
    this.onMeshChanged?.(this.mesh)
    if (previous) {
      this.scope.drop(previous)
    }
  }

  private addDraw(group: DistributionGroup, geometry: Geometry, material: Material) {
    if (!geometry || !material || material.noRender) {
      return false
    }
    const drawIndex = this.drawGroups.length
    this.drawGroups.push(group.index)
    this.drawArgs.push(...indirectDrawArgs(geometry, group.recordStart))
    this.ensureDrawCapacity()
    this.argsBuffer.setSubData(drawIndex * BYTES_PER_DRAW, new Uint32Array(this.drawArgs.slice(-WORDS_PER_DRAW)))
    this.drawBuffer.setSubData(drawIndex * 4, new Uint32Array([group.index]))

    const proxy = this.indirectMaterials.get(material)
    if (!this.materialIndex.has(proxy)) {
      this.materialIndex.set(proxy, this.materials.length)
      this.materials.push(proxy)
    }
    this.parts.push({
      geometryIndex: this.geometries.length,
      materialIndex: this.materialIndex.get(proxy),
    })
    this.geometries.push(this.scope.adopt(new IndirectGeometry(this.device, geometry, this, drawIndex)))
    return true
  }

  private ensureDrawCapacity() {
    if (this.drawGroups.length <= this.drawCapacity) {
      return
    }
    const oldArgs = this.argsBuffer as WebGpuBuffer | null
    const oldCapacity = this.drawCapacity
    this.drawCapacity = Math.max(64, this.drawCapacity * 2, this.drawGroups.length)
    this.drawBuffer?.dispose()
    this.argsBuffer = this.createBuffer(
      'distribution draw args',
      this.drawCapacity * BYTES_PER_DRAW,
      BufferUsage.STORAGE | BufferUsage.INDIRECT,
      true,
    )
    this.drawBuffer = this.createBuffer('distribution draw groups', this.drawCapacity * 4, BufferUsage.STORAGE)
    this.argsBuffer.setSubData(0, new Uint32Array(this.drawArgs))
    this.drawBuffer.setSubData(0, new Uint32Array(this.drawGroups))
    if (oldArgs) {
      // The static args have instance count 0, the counts are written by the cull pass. Groups are enabled after the
      // cull of the frame, so take over the counts of the last cull for the existing draws. Otherwise all draws of the
      // region render nothing for one frame (flickering) whenever the buffer grows.
      const encoder = this.device.gpu.createCommandEncoder({ label: 'distribution draw args grow' })
      encoder.copyBufferToBuffer(
        oldArgs.resource,
        0,
        (this.argsBuffer as WebGpuBuffer).resource,
        0,
        oldCapacity * BYTES_PER_DRAW,
      )
      this.device.gpu.queue.submit([encoder.finish()])
      oldArgs.dispose()
    }
    this.bindGroup = null
  }

  public getArgsBuffer() {
    return this.argsBuffer
  }

  private createMesh() {
    const { regionSize, mountainHeight } = this.placement
    const box = BoundingBox.create(0, 0, 0, regionSize, regionSize, mountainHeight)
    return new Mesh(this.device, {
      name: `distribution r_${this.data.header.region[0]}_${this.data.header.region[1]}`,
      geometries: [...this.geometries],
      materials: [...this.materials],
      parts: [...this.parts],
      boundingBox: box,
      boundingSphere: BoundingSphere.createFromBox(box),
    })
  }

  /**
   * Culls all records against the given camera and updates the indirect draw arguments
   */
  public cull(options: DistributionCullOptions) {
    if (!this.hasDraws) {
      return
    }
    const pipelines = getPipelines(this.device)
    this.bindGroup ||= this.device.gpu.createBindGroup({
      label: 'distribution cull',
      layout: pipelines.layout,
      entries: [
        this.paramsBuffer,
        this.recordBuffer,
        this.recordInfoBuffer,
        this.groupBuffer,
        this.outputBuffer,
        this.counterBuffer,
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
    p[28] = this.placement.originX
    p[29] = this.placement.originY
    p[30] = this.placement.cellSize
    p[31] = options.visibleDistance
    u[32] = this.recordCount
    u[33] = this.groups.length
    u[34] = this.drawGroups.length
    u[35] = this.data.cellsPerAxis
    this.paramsBuffer.setSubData(0, p)

    const encoder = this.device.gpu.createCommandEncoder({ label: 'distribution cull' })
    const pass = encoder.beginComputePass({ label: 'distribution cull' })
    pass.setBindGroup(0, this.bindGroup)
    pass.setPipeline(pipelines.reset)
    pass.dispatchWorkgroups(Math.ceil(this.groups.length / WORKGROUP_SIZE))
    pass.setPipeline(pipelines.cull)
    pass.dispatchWorkgroups(Math.ceil(this.recordCount / WORKGROUP_SIZE))
    pass.setPipeline(pipelines.finalize)
    pass.dispatchWorkgroups(Math.ceil(this.drawGroups.length / WORKGROUP_SIZE))
    pass.end()
    this.device.gpu.queue.submit([encoder.finish()])
  }

  private createBuffer(name: string, size: number, usage: number, readWrite = false) {
    return this.device.createBuffer({ name, size: Math.max(16, size), usage, readWrite })
  }

  public dispose() {
    this.scope.dispose()
    this.mesh = null
    this.indirectMaterials.dispose()
    this.recordBuffer.dispose()
    this.recordInfoBuffer.dispose()
    this.groupBuffer.dispose()
    this.outputBuffer.dispose()
    this.counterBuffer.dispose()
    this.paramsBuffer.dispose()
    this.argsBuffer?.dispose()
    this.drawBuffer?.dispose()
  }
}

interface CullPipelines {
  layout: GPUBindGroupLayout
  reset: GPUComputePipeline
  cull: GPUComputePipeline
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
    console.warn('distribution requires the indirect-first-instance feature, instances will not render correctly')
  }
  const storage = (type: GPUBufferBindingType): GPUBindGroupLayoutEntry['buffer'] => ({ type })
  const layout = gpu.createBindGroupLayout({
    label: 'distribution cull',
    entries: [
      storage('uniform'),
      storage('read-only-storage'),
      storage('read-only-storage'),
      storage('read-only-storage'),
      storage('storage'),
      storage('storage'),
      storage('read-only-storage'),
      storage('storage'),
    ].map((buffer, binding) => ({ binding, visibility: SHADER_STAGE_COMPUTE, buffer })),
  })
  const pipelineLayout = gpu.createPipelineLayout({ label: 'distribution cull', bindGroupLayouts: [layout] })
  const module = gpu.createShaderModule({ label: 'distribution cull', code: DISTRIBUTION_CULL_SHADER })
  const create = (entryPoint: string) =>
    gpu.createComputePipeline({
      label: `distribution ${entryPoint}`,
      layout: pipelineLayout,
      compute: { module, entryPoint },
    })
  result = {
    layout,
    reset: create('reset'),
    cull: create('cull'),
    finalize: create('finalize'),
  }
  pipelineCache.set(device, result)
  return result
}

const IDENTITY = mat4Identity()
function mat4Equals(a: Mat4, b: Mat4) {
  for (let i = 0; i < 16; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

const quat = new Float32Array(4)

/**
 * Writes `translate(x, y, z) * rotate(quat) * scale * local` in column major order. The rotation and scale are the
 * placement's own, identity for data without them.
 */
function writeRecord(
  out: Float32Array,
  offset: number,
  data: DistributionData,
  index: number,
  local: Mat4,
  placement: DistributionPlacement,
) {
  const unit = placement.regionSize / 0xffff
  const lx = data.posX[index] * unit
  const ly = data.posY[index] * unit
  const x = placement.originX + lx
  const y = placement.originY + ly
  const z = sampleHeight(placement, lx, ly)

  let s = 1
  if (data.rotations.length) {
    unpackRotation(data.rotations[index], quat)
    s = data.scales[index] * 0.01
  } else {
    quat[0] = 0
    quat[1] = 0
    quat[2] = 0
    quat[3] = 1
  }
  const [qx, qy, qz, qw] = quat
  const r00 = (1 - 2 * (qy * qy + qz * qz)) * s
  const r01 = 2 * (qx * qy - qz * qw) * s
  const r02 = 2 * (qx * qz + qy * qw) * s
  const r10 = 2 * (qx * qy + qz * qw) * s
  const r11 = (1 - 2 * (qx * qx + qz * qz)) * s
  const r12 = 2 * (qy * qz - qx * qw) * s
  const r20 = 2 * (qx * qz - qy * qw) * s
  const r21 = 2 * (qy * qz + qx * qw) * s
  const r22 = (1 - 2 * (qx * qx + qy * qy)) * s

  for (let col = 0; col < 4; col++) {
    const l0 = local[col * 4 + 0]
    const l1 = local[col * 4 + 1]
    const l2 = local[col * 4 + 2]
    const l3 = local[col * 4 + 3]
    out[offset + col * 4 + 0] = r00 * l0 + r01 * l1 + r02 * l2 + x * l3
    out[offset + col * 4 + 1] = r10 * l0 + r11 * l1 + r12 * l2 + y * l3
    out[offset + col * 4 + 2] = r20 * l0 + r21 * l1 + r22 * l2 + z * l3
    out[offset + col * 4 + 3] = l3
  }
}

/**
 * Bilinear height lookup at region local position
 */
function sampleHeight(placement: DistributionPlacement, lx: number, ly: number) {
  const map = placement.heightmap
  const size = Math.round(Math.sqrt(map.length))
  const fx = clamp((lx / placement.regionSize) * size, 0, size - 1)
  const fy = clamp((ly / placement.regionSize) * size, 0, size - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(x0 + 1, size - 1)
  const y1 = Math.min(y0 + 1, size - 1)
  const tx = fx - x0
  const ty = fy - y0
  // rows are stored top down
  const r0 = (size - 1 - y0) * size
  const r1 = (size - 1 - y1) * size
  const h0 = map[r0 + x0] * (1 - tx) + map[r0 + x1] * tx
  const h1 = map[r1 + x0] * (1 - tx) + map[r1 + x1] * tx
  return ((h0 * (1 - ty) + h1 * ty) / 0xffff) * placement.mountainHeight
}

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value
}
