import {
  BoundingFrustum,
  mat4Invert,
  rayBoxIntersectsAt,
  vec3,
  vec3ApplyMat4,
  vec3ApplyMat4Rotation,
  type IVec4,
  type Mat4,
} from '@gglib/math'
import type { CullBatch, CullBuffers, CullHit, CullLevel, CullLod, CullRecord, CullResult } from './protocol'

const FLOATS_PER_INSTANCE = 16

interface RecordState {
  id: number
  box: Float32Array<ArrayBuffer>
  data: Float32Array<ArrayBuffer>
  lod: CullLod | null
  /**
   * Levels of detail by level, undefined while not loaded
   */
  levels: Array<CullLevel | undefined>
  /**
   * Levels that were requested from the main thread
   */
  requested: boolean[]
  /**
   * Selected level of the last frame the record was visible, for the hysteresis
   */
  selected: number
}

export interface CullView {
  frame: number
  view: Mat4
  projection: Mat4
  projectionScaleY: number
  position: ArrayLike<number>
  visibilityMask: number
}

/**
 * Static models culled by the worker
 *
 * @remarks
 * Per frame, the visible records are found by a frustum test of their bounding spheres, a level of detail is
 * selected like ModelLod.select, and the instances of the selected level are grouped by batch. The result holds
 * the instances of all batches back to back, so each batch is drawn as one instanced draw.
 */
export class CullingWorld {
  private readonly records: RecordState[] = []
  /**
   * Bounding spheres of {@link records}, 4 floats each, same order
   */
  private spheres = new Float32Array(4 * 1024)
  private readonly indexById = new Map<number, number>()
  private batchLayers = new Float64Array(1024)

  private readonly frustum = new BoundingFrustum()
  /**
   * Indices of the visible records and their rendered level, per frame
   */
  private visible = new Uint32Array(1024)
  private visibleLevel = new Uint8Array(1024)
  private batchCounts = new Uint32Array(1024)
  private batchOffsets = new Uint32Array(1024)
  private batchVisible = new Uint8Array(1024)
  private touched: number[] = []

  public get recordCount() {
    return this.records.length
  }

  public addBatches(batches: CullBatch[]) {
    for (const batch of batches) {
      this.ensureBatchCapacity(batch.id + 1)
      this.batchLayers[batch.id] = batch.layer
    }
  }

  public add(record: CullRecord) {
    this.remove(record.id)
    const index = this.records.length
    this.records.push({
      id: record.id,
      box: record.box,
      data: record.data,
      lod: record.lod ? { ...record.lod } : null,
      levels: [record.base],
      requested: [true],
      selected: 0,
    })
    if (this.spheres.length < (index + 1) * 4) {
      const grown = new Float32Array(this.spheres.length * 2)
      grown.set(this.spheres)
      this.spheres = grown
    }
    this.spheres.set(record.sphere, index * 4)
    this.indexById.set(record.id, index)
  }

  public remove(id: number) {
    const index = this.indexById.get(id)
    if (index === undefined) {
      return
    }
    this.indexById.delete(id)
    const last = this.records.length - 1
    if (index !== last) {
      const moved = this.records[last]
      this.records[index] = moved
      this.spheres.copyWithin(index * 4, last * 4, last * 4 + 4)
      this.indexById.set(moved.id, index)
    }
    this.records.pop()
  }

  /**
   * Sets a loaded level of detail, null if the level does not exist
   */
  public setLevel(id: number, level: number, data: CullLevel | null) {
    const index = this.indexById.get(id)
    if (index === undefined) {
      return
    }
    const record = this.records[index]
    if (data) {
      record.levels[level] = data
    } else if (record.lod) {
      record.lod.maxLevel = Math.min(record.lod.maxLevel, level - 1)
    }
  }

  public cull(view: CullView, buffers: CullBuffers | null): CullResult {
    const start = performance.now()
    const records = this.records
    const spheres = this.spheres
    const planes = this.frustum.planes
    this.frustum.updateFromViewProjection(view.view, view.projection)

    // batches hidden by the visibility mask
    const mask = view.visibilityMask
    for (let i = 0; i < this.batchVisible.length; i++) {
      this.batchVisible[i] = this.batchLayers[i] & mask ? 1 : 0
    }

    // visible records and their level
    if (this.visible.length < records.length) {
      this.visible = new Uint32Array(records.length * 2)
      this.visibleLevel = new Uint8Array(records.length * 2)
    }
    const requests: number[] = []
    let visibleCount = 0
    for (let i = 0; i < records.length; i++) {
      if (!sphereInFrustum(planes, spheres, i * 4)) {
        continue
      }
      this.visible[visibleCount] = i
      this.visibleLevel[visibleCount] = this.selectLevel(records[i], i, view, requests)
      visibleCount++
    }

    // instances per batch
    const counts = this.batchCounts
    const touched = this.touched
    touched.length = 0
    let instanceCount = 0
    for (let v = 0; v < visibleCount; v++) {
      const level = records[this.visible[v]].levels[this.visibleLevel[v]]
      const batches = level.batches
      for (let p = 0; p < batches.length; p++) {
        const batch = batches[p]
        if (!this.batchVisible[batch]) {
          continue
        }
        if (counts[batch] === 0) {
          touched.push(batch)
        }
        counts[batch]++
        instanceCount++
      }
    }

    const result = this.allocate(buffers, instanceCount, touched.length)
    let offset = 0
    for (let b = 0; b < touched.length; b++) {
      const batch = touched[b]
      this.batchOffsets[batch] = offset
      result.batches[b * 3 + 0] = batch
      result.batches[b * 3 + 1] = counts[batch]
      result.batches[b * 3 + 2] = offset
      offset += counts[batch]
      counts[batch] = 0
    }

    // write the instances, grouped by batch
    const transforms = result.transforms
    const data = result.data
    const offsets = this.batchOffsets
    for (let v = 0; v < visibleCount; v++) {
      const record = records[this.visible[v]]
      const level = record.levels[this.visibleLevel[v]]
      const matrices = level.matrices
      const batchStart = level.batchStart
      const batches = level.batches
      const instanceData = record.data
      const nodeCount = batchStart.length - 1
      for (let n = 0; n < nodeCount; n++) {
        const source = n * FLOATS_PER_INSTANCE
        for (let p = batchStart[n]; p < batchStart[n + 1]; p++) {
          const batch = batches[p]
          if (!this.batchVisible[batch]) {
            continue
          }
          const target = offsets[batch]++ * FLOATS_PER_INSTANCE
          for (let k = 0; k < FLOATS_PER_INSTANCE; k++) {
            transforms[target + k] = matrices[source + k]
            data[target + k] = instanceData[k]
          }
        }
      }
    }

    result.frame = view.frame
    result.instanceCount = instanceCount
    result.batchCount = touched.length
    result.requests = requests
    result.stats = {
      records: records.length,
      visibleRecords: visibleCount,
      instances: instanceCount,
      batches: touched.length,
      cullMs: performance.now() - start,
    }
    return result
  }

  /**
   * Finds the nodes of the base levels that a ray hits, by the local bounding boxes of their meshes
   */
  public raycast(origin: ArrayLike<number>, direction: ArrayLike<number>, maxDistance: number): CullHit[] {
    const hits: CullHit[] = []
    const position = vec3(origin[0], origin[1], origin[2])
    const dir = vec3(direction[0], direction[1], direction[2])
    const localPos = vec3()
    const localDir = vec3()
    const min = vec3()
    const max = vec3()
    const point = vec3()
    const inverse = new Float32Array(16)
    for (const record of this.records) {
      const base = record.levels[0]
      const nodeCount = base.batchStart.length - 1
      for (let n = 0; n < nodeCount; n++) {
        const world = base.matrices.subarray(n * 16, n * 16 + 16)
        mat4Invert(world, inverse)
        vec3ApplyMat4(position, inverse, localPos)
        vec3ApplyMat4Rotation(dir, inverse, localDir)
        const b = base.boxes
        min.x = b[n * 6 + 0]
        min.y = b[n * 6 + 1]
        min.z = b[n * 6 + 2]
        max.x = b[n * 6 + 3]
        max.y = b[n * 6 + 4]
        max.z = b[n * 6 + 5]
        const t = rayBoxIntersectsAt(localPos, localDir, min, max)
        if (isNaN(t) || t < 0) {
          continue
        }
        // back to world space for the distance
        point.x = localPos.x + localDir.x * t
        point.y = localPos.y + localDir.y * t
        point.z = localPos.z + localDir.z * t
        vec3ApplyMat4(point, world, point)
        const dx = point.x - position.x
        const dy = point.y - position.y
        const dz = point.z - position.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (distance > 0 && distance < maxDistance) {
          hits.push({ record: record.id, node: n, distance })
        }
      }
    }
    return hits
  }

  /**
   * Selects the level of detail like ModelLod.select and resolves it to the closest finer level that is loaded
   */
  private selectLevel(record: RecordState, index: number, view: CullView, requests: number[]): number {
    const lod = record.lod
    if (!lod) {
      return 0
    }
    const position = view.position
    const box = record.box
    const dx = Math.max(box[0] - position[0], 0, position[0] - box[3])
    const dy = Math.max(box[1] - position[1], 0, position[1] - box[4])
    const dz = Math.max(box[2] - position[2], 0, position[2] - box[5])
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    const s = index * 4
    const cx = this.spheres[s] - position[0]
    const cy = this.spheres[s + 1] - position[1]
    const cz = this.spheres[s + 2] - position[2]
    const radius = this.spheres[s + 3]
    const centerDistance = Math.sqrt(cx * cx + cy * cy + cz * cz)
    const screenSize =
      centerDistance <= radius ? Number.POSITIVE_INFINITY : (radius * view.projectionScaleY) / centerDistance

    let level = selectLevel(lod, distance, record.selected)
    level = Math.max(0, Math.min(level, lod.maxLevel))
    while (level > 0) {
      const max = lod.maxScreenSize?.[level]
      if (max == null || max < 0 || screenSize < max) {
        break
      }
      level--
    }
    record.selected = level

    if (!record.levels[level] && !record.requested[level]) {
      record.requested[level] = true
      requests.push(record.id, level)
    }
    while (level > 0 && !record.levels[level]) {
      level--
    }
    return level
  }

  private allocate(buffers: CullBuffers | null, instanceCount: number, batchCount: number): CullResult {
    const floats = instanceCount * FLOATS_PER_INSTANCE
    let transforms = buffers?.transforms
    let data = buffers?.data
    let batches = buffers?.batches
    if (!transforms || transforms.length < floats) {
      transforms = new Float32Array(Math.max(floats * 1.5, 1024) | 0)
    }
    if (!data || data.length < floats) {
      data = new Float32Array(Math.max(floats * 1.5, 1024) | 0)
    }
    if (!batches || batches.length < batchCount * 3) {
      batches = new Uint32Array(Math.max(batchCount * 3 * 1.5, 1024) | 0)
    }
    return {
      transforms,
      data,
      batches,
      frame: 0,
      instanceCount: 0,
      batchCount: 0,
      requests: null,
      stats: null,
    }
  }

  private ensureBatchCapacity(count: number) {
    if (count <= this.batchLayers.length) {
      return
    }
    const size = Math.max(count, this.batchLayers.length * 2)
    const layers = new Float64Array(size)
    layers.set(this.batchLayers)
    this.batchLayers = layers
    this.batchCounts = new Uint32Array(size)
    this.batchOffsets = new Uint32Array(size)
    this.batchVisible = new Uint8Array(size)
  }
}

function sphereInFrustum(planes: IVec4[], spheres: Float32Array, s: number): boolean {
  const x = spheres[s]
  const y = spheres[s + 1]
  const z = spheres[s + 2]
  const r = spheres[s + 3]
  for (let i = 0; i < 6; i++) {
    const p = planes[i]
    if (p.x * x + p.y * y + p.z * z + p.w > r) {
      return false
    }
  }
  return true
}

/**
 * Same as selectLodLevel of @gglib/model (not imported, the worker only depends on @gglib/math)
 */
function selectLevel(lod: CullLod, at: number, current: number): number {
  if (current >= 0) {
    const start = levelStart(lod, current)
    const end = levelStart(lod, current + 1)
    const below = current > 0 ? (start - levelStart(lod, current - 1)) * lod.hysteresis : 0
    const above = (end - start) * lod.hysteresis
    if (at >= start - below && at < end + above) {
      return current
    }
  }
  const position = at / lod.distance
  if (lod.spacing === 'doubling') {
    return position < 1 ? 0 : Math.floor(Math.log2(position)) + 1
  }
  return Math.floor(position)
}

function levelStart(lod: CullLod, level: number): number {
  if (level <= 0) {
    return 0
  }
  if (lod.spacing === 'doubling') {
    return lod.distance * 2 ** (level - 1)
  }
  return lod.distance * level
}
