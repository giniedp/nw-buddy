import {
  BoundingBox,
  mat4Invert,
  mat4Multiply,
  vec3,
  vec3ApplyMat4,
  vec3ApplyMat4Rotation,
  vec3Length,
  type IVec3,
  type Mat4,
} from '@gglib/math'
import type { ViewerShape } from '../../../api/types'
import {
  COLLISION_GRID_CELL_SIZE,
  COLLISION_PATROL_RANGE,
  COLLISION_PLAYER_LOAD_CONCURRENCY,
  COLLISION_PLAYER_RANGE,
} from '../../../constants'
import { rnrLeaves, viewerShapeLeaves, type ColliderLeaf } from './colliders'
import { closestPointOnLeaf, LeafContact, raycastLeaf } from './leafQueries'
import type { ShapeAssets } from './ShapeAssets'
import { SpatialGrid } from './SpatialGrid'

export interface ColliderInfo {
  id: number
  /**
   * Shape asset file path, if not a primitive
   */
  path?: string
  primitive?: ViewerShape
  /**
   * Entity world transform, column major
   */
  world: ArrayLike<number>
}

interface ColliderInstance {
  info: ColliderInfo
  world: Mat4
  state: 'pending' | 'loading' | 'ready' | 'failed'
  removed: boolean
  /**
   * Ids of the leaf instances in the grid
   */
  leaves: number[]
}

interface LeafInstance {
  leaf: ColliderLeaf
  world: Mat4
  inverse: Mat4
  box: BoundingBox
  /**
   * Largest scale of the inverse transform, converts world distances to (upper bounds of) local distances
   */
  inverseScale: number
}

const DOWN = vec3(0, 0, -1)
const local = vec3()
const localDir = vec3()
const closest = vec3()
const hit = vec3()

/**
 * Static colliders of the world in a 2D grid, with the queries of the player resolve
 */
export class CollisionWorld {
  private readonly assets: ShapeAssets
  private readonly instances = new Map<number, ColliderInstance>()
  private readonly pending = new Set<ColliderInstance>()
  private readonly leafCache = new Map<string, ColliderLeaf[]>()
  private readonly leafInstances: Array<LeafInstance | null> = []
  private readonly freeLeafIds: number[] = []
  private readonly grid = new SpatialGrid(COLLISION_GRID_CELL_SIZE)
  private loading = 0
  private scanX = Number.NaN
  private scanY = Number.NaN
  private scanTime = 0
  private patrolPoints = new Float32Array(0)
  private patrolCount = 0

  public constructor(assets: ShapeAssets) {
    this.assets = assets
  }

  public get stats() {
    return {
      instances: this.instances.size,
      pending: this.pending.size,
      loading: this.loading,
      leaves: this.leafInstances.length - this.freeLeafIds.length,
      assets: this.leafCache.size,
    }
  }

  public add(info: ColliderInfo) {
    this.remove(info.id)
    const instance: ColliderInstance = {
      info,
      world: Float32Array.from(info.world),
      state: 'pending',
      removed: false,
      leaves: [],
    }
    this.instances.set(info.id, instance)
    if (info.primitive) {
      this.place(instance, viewerShapeLeaves(info.primitive))
    } else if (info.path) {
      this.pending.add(instance)
    }
  }

  public remove(id: number) {
    const instance = this.instances.get(id)
    if (!instance) {
      return
    }
    instance.removed = true
    this.instances.delete(id)
    this.pending.delete(instance)
    for (const leafId of instance.leaves) {
      const leaf = this.leafInstances[leafId]
      this.grid.remove(leafId, leaf.box)
      this.leafInstances[leafId] = null
      this.freeLeafIds.push(leafId)
    }
    instance.leaves.length = 0
  }

  /**
   * Sets the patrol positions (x, y pairs) whose colliders {@link loadNear} loads within {@link COLLISION_PATROL_RANGE}
   */
  public setPatrolPoints(points: ArrayLike<number>, count: number, stride: number) {
    if (this.patrolPoints.length < count * 2) {
      this.patrolPoints = new Float32Array(count * 2)
    }
    for (let i = 0; i < count; i++) {
      this.patrolPoints[i * 2] = points[i * stride]
      this.patrolPoints[i * 2 + 1] = points[i * stride + 1]
    }
    this.patrolCount = count
  }

  /**
   * Starts loading the shape assets of pending colliders near the player (within {@link COLLISION_PLAYER_RANGE}) and
   * the patrol points (within {@link COLLISION_PATROL_RANGE}), nearest first
   *
   * @param x - player position, NaN without a player
   */
  public loadNear(x: number, y: number) {
    if (!this.pending.size || this.loading >= COLLISION_PLAYER_LOAD_CONCURRENCY) {
      return
    }
    // scanning all pending colliders is cheap, but not needed every frame
    const now = performance.now()
    const moved = Number.isNaN(x) ? 0 : Math.hypot(x - this.scanX, y - this.scanY)
    if (!(moved >= 2) && now - this.scanTime < 250) {
      return
    }
    this.scanX = x
    this.scanY = y
    this.scanTime = now
    const playerRangeSq = COLLISION_PLAYER_RANGE * COLLISION_PLAYER_RANGE
    const patrolRangeSq = COLLISION_PATROL_RANGE * COLLISION_PATROL_RANGE
    const points = this.patrolPoints
    const candidates: Array<{ instance: ColliderInstance; distance: number }> = []
    for (const instance of this.pending) {
      const cx = instance.world[12]
      const cy = instance.world[13]
      let distance = Number.POSITIVE_INFINITY
      const dx = cx - x
      const dy = cy - y
      if (dx * dx + dy * dy <= playerRangeSq) {
        distance = dx * dx + dy * dy
      }
      for (let i = 0; i < this.patrolCount; i++) {
        const px = cx - points[i * 2]
        const py = cy - points[i * 2 + 1]
        const d = px * px + py * py
        if (d <= patrolRangeSq && d < distance) {
          distance = d
        }
      }
      if (distance !== Number.POSITIVE_INFINITY) {
        candidates.push({ instance, distance })
      }
    }
    candidates.sort((a, b) => a.distance - b.distance)
    for (const { instance } of candidates) {
      if (this.loading >= COLLISION_PLAYER_LOAD_CONCURRENCY) {
        break
      }
      this.load(instance)
    }
  }

  /**
   * Highest hit of a downward ray from `top` that lies above `bottom`, NaN if nothing is hit
   */
  public groundHeight(x: number, y: number, top: number, bottom: number): number {
    let result = Number.NaN
    if (bottom >= top) {
      return result
    }
    this.grid.query(x, y, x, y, (leafId) => {
      const instance = this.leafInstances[leafId]
      const box = instance.box
      if (box.min.x > x || box.max.x < x || box.min.y > y || box.max.y < y || box.min.z > top || box.max.z < bottom) {
        return
      }
      // ray in leaf local space, the direction is normalized there and the length converted
      local.x = x
      local.y = y
      local.z = top
      vec3ApplyMat4(local, instance.inverse, local)
      vec3ApplyMat4Rotation(DOWN, instance.inverse, localDir)
      const scale = vec3Length(localDir)
      if (scale < 1e-9) {
        return
      }
      localDir.x /= scale
      localDir.y /= scale
      localDir.z /= scale
      const t = raycastLeaf(instance.leaf, local, localDir, (top - bottom) * scale)
      if (Number.isNaN(t)) {
        return
      }
      hit.x = local.x + localDir.x * t
      hit.y = local.y + localDir.y * t
      hit.z = local.z + localDir.z * t
      vec3ApplyMat4(hit, instance.world, hit)
      if (hit.z <= top && hit.z > bottom && !(hit.z <= result)) {
        result = hit.z
      }
    })
    return result
  }

  /**
   * Accumulates the horizontal push that moves a sphere out of the colliders it penetrates
   *
   * @returns the number of contacts
   */
  public pushOut(center: IVec3, radius: number, out: IVec3): number {
    let contacts = 0
    const r = radius
    this.grid.query(center.x - r, center.y - r, center.x + r, center.y + r, (leafId) => {
      const instance = this.leafInstances[leafId]
      const box = instance.box
      if (
        box.min.x > center.x + r ||
        box.max.x < center.x - r ||
        box.min.y > center.y + r ||
        box.max.y < center.y - r ||
        box.min.z > center.z + r ||
        box.max.z < center.z - r
      ) {
        return
      }
      vec3ApplyMat4(center, instance.inverse, local)
      const contact = closestPointOnLeaf(instance.leaf, local, r * instance.inverseScale, closest)
      if (contact === LeafContact.None) {
        return
      }
      vec3ApplyMat4(closest, instance.world, closest)
      let dx = center.x - closest.x
      let dy = center.y - closest.y
      const dz = center.z - closest.z
      const distance = Math.hypot(dx, dy, dz)
      if (contact === LeafContact.Outside && distance >= r) {
        return
      }
      if (contact === LeafContact.Inside) {
        dx = -dx
        dy = -dy
      }
      const horizontal = Math.hypot(dx, dy)
      // floors and ceilings are handled by the ground ray, only walls push
      if (horizontal < 1e-6 || horizontal < 0.3 * distance) {
        return
      }
      const amount = contact === LeafContact.Inside ? r + distance : r - distance
      out.x += (dx / horizontal) * amount
      out.y += (dy / horizontal) * amount
      contacts++
    })
    return contacts
  }

  private async load(instance: ColliderInstance) {
    const path = instance.info.path
    this.pending.delete(instance)
    instance.state = 'loading'
    this.loading++
    try {
      let leaves = this.leafCache.get(path)
      if (!leaves) {
        const asset = await this.assets.load(path)
        leaves = this.leafCache.get(path) ?? rnrLeaves(asset)
        this.leafCache.set(path, leaves)
      }
      if (!instance.removed) {
        this.place(instance, leaves)
      }
    } catch (err) {
      instance.state = 'failed'
      console.warn('collision shape not loaded', path, err)
    } finally {
      this.loading--
    }
  }

  private place(instance: ColliderInstance, leaves: ColliderLeaf[]) {
    for (const leaf of leaves) {
      const world = mat4Multiply(instance.world, leaf.local, new Float32Array(16))
      const inverse = mat4Invert(world, new Float32Array(16))
      const leafInstance: LeafInstance = {
        leaf,
        world,
        inverse,
        box: BoundingBox.transform(leaf.bounds, world),
        inverseScale: maxAxisScale(inverse),
      }
      const leafId = this.freeLeafIds.pop() ?? this.leafInstances.length
      this.leafInstances[leafId] = leafInstance
      this.grid.insert(leafId, leafInstance.box)
      instance.leaves.push(leafId)
    }
    instance.state = 'ready'
  }
}

function maxAxisScale(m: Mat4) {
  return Math.max(Math.hypot(m[0], m[1], m[2]), Math.hypot(m[4], m[5], m[6]), Math.hypot(m[8], m[9], m[10]))
}
