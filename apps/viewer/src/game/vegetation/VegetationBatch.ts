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
import { BoundingBox, BoundingFrustum, BoundingSphere, mat4Identity, type Mat4 } from '@gglib/math'
import type { Model } from '@gglib/model'
import type { RegionVegetationData } from '../../api'
import { VEGETATION_FADE_RANGE, VEGETATION_VISIBLE_DISTANCE } from '../../constants'
import { setDitherFadeConstants } from '../../material'
import {
  BYTES_PER_DRAW,
  indirectDrawArgs,
  IndirectGeometry,
  IndirectMaterials,
  WORDS_PER_DRAW,
} from '../distribution/IndirectDraw'
import {
  VEGETATION_INSTANCE_SIZE,
  VEGETATION_INSTANCE_WORDS,
  writeVegetationCell,
  type VegetationCell,
  type VegetationFile,
} from './parseVegetation'
import { VEGETATION_CULL_SHADER } from './VegetationCull.wgsl'

const BYTES_PER_MAT4 = 64
// node mat4 + sphere vec4 + info vec4u
const BYTES_PER_GROUP = BYTES_PER_MAT4 + 16 + 16
const WORDS_PER_GROUP = BYTES_PER_GROUP / 4
const PARAMS_BYTE_SIZE = 6 * 16 + 16 + 16 + 16
const WORKGROUP_SIZE = 64

export interface VegetationPlacement {
  originX: number
  originY: number
  mountainHeight: number
}

export interface VegetationCullOptions {
  view: Mat4
  projection: Mat4
  cameraPosition: { x: number; y: number; z: number }
  /**
   * Instances further away than this are not rendered
   */
  visibleDistance: number
}

export type VegetationGroupState = 'idle' | 'loading' | 'ready' | 'empty'

/**
 * A group is one asset of the region.vegetation asset table (model + optional material override)
 */
export interface VegetationGroup {
  index: number
  model: string
  material: string
  state: VegetationGroupState
  /**
   * Number of instances in loaded cells
   */
  loadedCount: number
  /**
   * First instance of this group in the output buffer
   */
  outputStart: number
  /**
   * Wind strength of the asset (descriptor Bending), the per instance InstBendInfo.w of the baked vegetation records:
   * the detail bending speed is bending * global wind length (VEGETATION_BENDING in the vegetation shader)
   */
  bending: number
}

/**
 * GPU driven rendering of the vegetation of a region.
 *
 * @remarks
 * Only the cells around the camera are uploaded. The instance buffer is divided into slots of
 * `maxInstancesPerCell` instances, each loaded cell occupies one slot. Instances stay packed (16 bytes),
 * the cull compute pass decodes them and writes the visible world transforms compacted per group into
 * the output buffer and the instance counts into the indirect draw arguments.
 * The output range of each group is sized by the instances of that group in the loaded cells and is
 * recomputed whenever cells are loaded or unloaded.
 */
export class VegetationBatch {
  public readonly device: WebGpuDevice
  public readonly file: VegetationFile
  public readonly groups: VegetationGroup[]
  public readonly slotCount: number
  public readonly slotSize: number

  /**
   * Emitted with the new mesh whenever draws are added
   */
  public onMeshChanged: (mesh: Mesh) => void = null

  private placement: VegetationPlacement
  private slotCells: Array<VegetationCell | null>
  private cellSlots = new Map<VegetationCell, number>()
  private staging: Uint32Array<ArrayBuffer>
  private slotInfo = new Uint32Array(4)
  private groupData: Uint32Array<ArrayBuffer>
  private groupDataF32: Float32Array
  private layoutDirty = true

  private instanceBuffer: Buffer
  private slotBuffer: Buffer
  private groupBuffer: Buffer
  private outputBuffer: Buffer
  private counterBuffer: Buffer
  private paramsBuffer: Buffer
  private drawBuffer: Buffer | null = null
  private argsBuffer: Buffer | null = null
  private bindGroup: GPUBindGroup | null = null

  private drawGroups: number[] = []
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

  public get hasDraws() {
    return this.drawGroups.length > 0
  }

  public get loadedCells() {
    return this.cellSlots.keys()
  }

  public get freeSlots() {
    return this.slotCount - this.cellSlots.size
  }

  public constructor(
    device: Device,
    file: VegetationFile,
    data: RegionVegetationData,
    placement: VegetationPlacement,
    slotCount: number,
    name: string,
  ) {
    this.device = device as WebGpuDevice
    this.scope = device.createScope(`vegetation batch ${name}`)
    this.file = file
    this.placement = placement
    this.slotCount = slotCount
    this.slotSize = file.maxInstancesPerCell
    this.slotCells = new Array(slotCount).fill(null)
    this.staging = new Uint32Array(this.slotSize * VEGETATION_INSTANCE_WORDS)

    this.groups = data.assets.map((asset, index) => ({
      index,
      model: asset.model,
      material: asset.material || '',
      state: asset.model ? 'idle' : 'empty',
      loadedCount: 0,
      outputStart: 0,
      bending: (asset.kind ?? 0) / 100,
    }))
    this.groupData = new Uint32Array(Math.max(1, this.groups.length) * WORDS_PER_GROUP)
    this.groupDataF32 = new Float32Array(this.groupData.buffer)

    const instanceCapacity = slotCount * this.slotSize
    this.instanceBuffer = this.createBuffer(
      `${name} instances`,
      instanceCapacity * VEGETATION_INSTANCE_SIZE,
      BufferUsage.STORAGE,
    )
    this.slotBuffer = this.createBuffer(`${name} slots`, slotCount * 16, BufferUsage.STORAGE)
    this.slotBuffer.setSubData(0, new Uint32Array(slotCount * 4))
    this.groupBuffer = this.createBuffer(`${name} groups`, this.groupData.byteLength, BufferUsage.STORAGE)
    this.groupBuffer.setSubData(0, this.groupData)
    this.outputBuffer = this.createBuffer(
      `${name} output`,
      instanceCapacity * BYTES_PER_MAT4,
      BufferUsage.STORAGE,
      true,
    )
    this.counterBuffer = this.createBuffer(`${name} counters`, this.groups.length * 4, BufferUsage.STORAGE, true)
    this.paramsBuffer = this.createBuffer(`${name} params`, PARAMS_BYTE_SIZE, BufferUsage.UNIFORM)

    // fade out before the visible distance, nothing takes over beyond
    const constants = {}
    setDitherFadeConstants(constants, {
      mode: 'out',
      start: VEGETATION_VISIBLE_DISTANCE - VEGETATION_FADE_RANGE,
      end: VEGETATION_VISIBLE_DISTANCE,
    })

    this.indirectMaterials = new IndirectMaterials(this.device, this.outputBuffer, constants)
  }

  public isCellLoaded(cell: VegetationCell) {
    return this.cellSlots.has(cell)
  }

  /**
   * Uploads the instances of a cell into a free slot. Returns false if there is no free slot.
   */
  public loadCell(cell: VegetationCell): boolean {
    if (this.cellSlots.has(cell)) {
      return true
    }
    const slot = this.slotCells.indexOf(null)
    if (slot < 0) {
      return false
    }
    const count = writeVegetationCell(this.file, cell, this.staging, 0)
    this.instanceBuffer.setSubData(
      slot * this.slotSize * VEGETATION_INSTANCE_SIZE,
      this.staging.subarray(0, count * VEGETATION_INSTANCE_WORDS),
    )
    this.setSlotCount(slot, count)
    this.slotCells[slot] = cell
    this.cellSlots.set(cell, slot)
    for (const group of cell.groups) {
      this.groups[group.asset].loadedCount += group.count
    }
    this.layoutDirty = true
    return true
  }

  public unloadCell(cell: VegetationCell) {
    const slot = this.cellSlots.get(cell)
    if (slot === undefined) {
      return
    }
    this.setSlotCount(slot, 0)
    this.slotCells[slot] = null
    this.cellSlots.delete(cell)
    for (const group of cell.groups) {
      this.groups[group.asset].loadedCount -= group.count
    }
    this.layoutDirty = true
  }

  private setSlotCount(slot: number, count: number) {
    this.slotInfo[0] = count
    this.slotBuffer.setSubData(slot * 16, this.slotInfo)
  }

  /**
   * Enables rendering of a group once its model is loaded
   */
  public enableGroup(group: VegetationGroup, model: Model | null) {
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
        console.warn('vegetation model has multiple mesh nodes with different transforms', group.model)
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
    const o = group.index * WORDS_PER_GROUP
    for (let i = 0; i < 16; i++) {
      this.groupDataF32[o + i] = node ? node[i] : IDENTITY[i]
    }
    this.groupDataF32[o + 16] = sphere.center.x
    this.groupDataF32[o + 17] = sphere.center.y
    this.groupDataF32[o + 18] = sphere.center.z
    this.groupDataF32[o + 19] = sphere.radius
    this.groupData[o + 20] = 1
    this.layoutDirty = true

    const previous = this.mesh
    this.mesh = this.scope.adopt(this.createMesh())
    this.onMeshChanged?.(this.mesh)
    if (previous) {
      this.scope.drop(previous)
    }
  }

  private addDraw(group: VegetationGroup, geometry: Geometry, material: Material) {
    if (!geometry || !material || material.noRender) {
      return false
    }
    const drawIndex = this.drawGroups.length
    this.drawGroups.push(group.index)
    this.drawArgs.push(...indirectDrawArgs(geometry, group.outputStart))
    this.ensureDrawCapacity()
    this.drawBuffer.setSubData(drawIndex * 4, new Uint32Array([group.index]))

    const proxy = this.indirectMaterials.get(material, { VEGETATION_BENDING: group.bending })
    if (!this.materialIndex.has(proxy)) {
      this.materialIndex.set(proxy, this.materials.length)
      this.materials.push(proxy)
    }
    this.parts.push({
      geometryIndex: this.geometries.length,
      materialIndex: this.materialIndex.get(proxy),
    })
    this.geometries.push(this.scope.adopt(new IndirectGeometry(this.device, geometry, this, drawIndex)))
    this.layoutDirty = true
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
      'vegetation draw args',
      this.drawCapacity * BYTES_PER_DRAW,
      BufferUsage.STORAGE | BufferUsage.INDIRECT,
      true,
    )
    this.drawBuffer = this.createBuffer('vegetation draw groups', this.drawCapacity * 4, BufferUsage.STORAGE)
    this.drawBuffer.setSubData(0, new Uint32Array(this.drawGroups))
    if (oldArgs) {
      // Groups are enabled after the cull of the frame, the new buffer would draw nothing until the next cull.
      // Take over the args of the last cull for the existing draws, otherwise the vegetation of the region
      // disappears for one frame (flickering) whenever the buffer grows. New draws start empty (zeroed buffer).
      const encoder = this.device.gpu.createCommandEncoder({ label: 'vegetation draw args grow' })
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
    this.layoutDirty = true
  }

  /**
   * Assigns the output ranges of the groups based on the instances in the loaded cells
   */
  private updateLayout() {
    if (!this.layoutDirty) {
      return
    }
    this.layoutDirty = false
    let offset = 0
    for (const group of this.groups) {
      group.outputStart = offset
      this.groupData[group.index * WORDS_PER_GROUP + 21] = offset
      if (group.state === 'ready') {
        offset += group.loadedCount
      }
    }
    this.groupBuffer.setSubData(0, this.groupData)

    for (let i = 0; i < this.drawGroups.length; i++) {
      const start = this.groups[this.drawGroups[i]].outputStart
      const o = i * WORDS_PER_DRAW
      // first instance is the 5th word for indexed draws, the 4th for non indexed draws (see indirectDrawArgs)
      if (this.geometries[i].indexBuffer) {
        this.drawArgs[o + 4] = start
      } else {
        this.drawArgs[o + 3] = start
      }
    }
    if (this.argsBuffer && this.drawArgs.length) {
      this.argsBuffer.setSubData(0, new Uint32Array(this.drawArgs))
    }
  }

  public getArgsBuffer() {
    return this.argsBuffer
  }

  private createMesh() {
    const size = this.file.regionSize
    const { originX, originY, mountainHeight } = this.placement
    const box = BoundingBox.create(originX, originY, 0, originX + size, originY + size, mountainHeight)
    return new Mesh(this.device, {
      name: 'vegetation',
      geometries: [...this.geometries],
      materials: [...this.materials],
      parts: [...this.parts],
      boundingBox: box,
      boundingSphere: BoundingSphere.createFromBox(box),
    })
  }

  /**
   * Culls the loaded instances against the given camera and updates the indirect draw arguments
   */
  public cull(options: VegetationCullOptions) {
    if (!this.hasDraws) {
      return
    }
    this.updateLayout()

    const pipelines = getPipelines(this.device)
    this.bindGroup ||= this.device.gpu.createBindGroup({
      label: 'vegetation cull',
      layout: pipelines.layout,
      entries: [
        this.paramsBuffer,
        this.instanceBuffer,
        this.slotBuffer,
        this.groupBuffer,
        this.outputBuffer,
        this.counterBuffer,
        this.drawBuffer,
        this.argsBuffer,
      ].map((buffer, binding) => ({ binding, resource: { buffer: (buffer as WebGpuBuffer).resource } })),
    })

    // only dispatch up to the highest used slot
    let slots = 0
    for (let i = this.slotCells.length - 1; i >= 0; i--) {
      if (this.slotCells[i]) {
        slots = i + 1
        break
      }
    }
    const threads = slots * this.slotSize

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
    p[27] = options.visibleDistance
    p[28] = this.placement.originX
    p[29] = this.placement.originY
    p[30] = this.file.regionSize
    p[31] = 0
    u[32] = threads
    u[33] = this.groups.length
    u[34] = this.drawGroups.length
    u[35] = this.slotSize
    this.paramsBuffer.setSubData(0, p)

    const encoder = this.device.gpu.createCommandEncoder({ label: 'vegetation cull' })
    const pass = encoder.beginComputePass({ label: 'vegetation cull' })
    pass.setBindGroup(0, this.bindGroup)
    pass.setPipeline(pipelines.reset)
    pass.dispatchWorkgroups(Math.ceil(this.groups.length / WORKGROUP_SIZE))
    if (threads > 0) {
      pass.setPipeline(pipelines.cull)
      pass.dispatchWorkgroups(Math.ceil(threads / WORKGROUP_SIZE))
    }
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
    this.instanceBuffer.dispose()
    this.slotBuffer.dispose()
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
  const storage = (type: GPUBufferBindingType): GPUBindGroupLayoutEntry['buffer'] => ({ type })
  const layout = gpu.createBindGroupLayout({
    label: 'vegetation cull',
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
  const pipelineLayout = gpu.createPipelineLayout({ label: 'vegetation cull', bindGroupLayouts: [layout] })
  const module = gpu.createShaderModule({ label: 'vegetation cull', code: VEGETATION_CULL_SHADER })
  const create = (entryPoint: string) =>
    gpu.createComputePipeline({
      label: `vegetation ${entryPoint}`,
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
