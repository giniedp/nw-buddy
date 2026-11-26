import type { GameEntity } from '@gglib/ecs'

const KEY_OFFSET = 1 << 15
const KEY_STRIDE = 1 << 16

function cellKey(ix: number, iy: number) {
  return (ix + KEY_OFFSET) * KEY_STRIDE + (iy + KEY_OFFSET)
}

export interface RangeGridStats {
  /**
   * Number of distance tests
   */
  tested: number
  /**
   * Number of activated entities
   */
  activated: number
  /**
   * Number of deactivated entities
   */
  deactivated: number
  /**
   * Number of evaluations of the cells around the camera
   */
  evaluations: number
}

export interface RangeGridEntry {
  /**
   * Cell size of the grid, which is the range class
   */
  cellSize: number
  x: number
  y: number
  z: number
  /**
   * Activation range
   */
  range: number
  /**
   * Range beyond which the entity is deactivated
   */
  deactivateRange: number
  /**
   * Entity is waiting for activation
   */
  queued: boolean
}

/**
 * Sparse 2D grid of range activatable entities of one range class.
 *
 * All entities in the grid have a range of at most the cell size. Only entities in the 3x3 cells
 * around the camera cell can be in range, entities in cells that leave this neighborhood are deactivated without a distance test.
 * The neighborhood is re-evaluated when the camera moved a fraction of the cell size.
 */
export class RangeGrid {
  public readonly cellSize: number
  public count = 0
  public readonly stats: RangeGridStats = { tested: 0, activated: 0, deactivated: 0, evaluations: 0 }

  private readonly invCellSize: number
  private readonly hysteresisSq: number
  private readonly updateDistanceSq: number

  private x = new Float32Array(64)
  private y = new Float32Array(64)
  private z = new Float32Array(64)
  private rangeSq = new Float32Array(64)
  private keys = new Float64Array(64)
  private slots = new Int32Array(64)
  private queued = new Uint8Array(64)
  private entities: GameEntity[] = []
  private indices = new Map<GameEntity, number>()
  private cells = new Map<number, number[]>()

  private queue: number[] = []
  private queueHead = 0

  private cellX = NaN
  private cellY = NaN
  private evalX = Infinity
  private evalY = Infinity
  private evalZ = Infinity
  private dirty = false

  public constructor(options: { cellSize: number; hysteresis: number; updateDistanceFactor: number }) {
    this.cellSize = options.cellSize
    this.invCellSize = 1 / options.cellSize
    this.hysteresisSq = options.hysteresis * options.hysteresis
    const updateDistance = Math.max(1, options.cellSize * options.updateDistanceFactor)
    this.updateDistanceSq = updateDistance * updateDistance
  }

  /**
   * Number of entities waiting for activation
   */
  public get pending() {
    return this.queue.length - this.queueHead
  }

  public add(entity: GameEntity, x: number, y: number, z: number, range: number) {
    if (this.count === this.x.length) {
      this.grow(this.count * 2)
    }
    const index = this.count++
    const ix = Math.floor(x * this.invCellSize)
    const iy = Math.floor(y * this.invCellSize)
    const key = cellKey(ix, iy)
    let cell = this.cells.get(key)
    if (!cell) {
      cell = []
      this.cells.set(key, cell)
    }
    this.x[index] = x
    this.y[index] = y
    this.z[index] = z
    this.rangeSq[index] = range * range
    this.keys[index] = key
    this.slots[index] = cell.length
    this.queued[index] = 0
    this.entities[index] = entity
    this.indices.set(entity, index)
    cell.push(index)

    if (Math.abs(ix - this.cellX) <= 1 && Math.abs(iy - this.cellY) <= 1) {
      this.dirty = true
    }
  }

  /**
   * Moves a registered entity to a new position and range in place. The range must fit the class (at most the cell
   * size). The activation queue stays valid, entry indices don't change.
   *
   * @returns false if the entity is not in this grid
   */
  public move(entity: GameEntity, x: number, y: number, z: number, range: number): boolean {
    const index = this.indices.get(entity)
    if (index === undefined) {
      return false
    }
    const ix = Math.floor(x * this.invCellSize)
    const iy = Math.floor(y * this.invCellSize)
    const key = cellKey(ix, iy)
    if (key !== this.keys[index]) {
      // swap-remove from the old cell
      const oldCell = this.cells.get(this.keys[index])
      const slot = this.slots[index]
      const lastInCell = oldCell.pop()
      if (lastInCell !== index) {
        oldCell[slot] = lastInCell
        this.slots[lastInCell] = slot
      }
      if (!oldCell.length) {
        this.cells.delete(this.keys[index])
      }
      let cell = this.cells.get(key)
      if (!cell) {
        cell = []
        this.cells.set(key, cell)
      }
      this.keys[index] = key
      this.slots[index] = cell.length
      cell.push(index)
    }
    this.x[index] = x
    this.y[index] = y
    this.z[index] = z
    this.rangeSq[index] = range * range
    if (Math.abs(ix - this.cellX) <= 1 && Math.abs(iy - this.cellY) <= 1) {
      this.dirty = true
    }
    return true
  }

  /**
   * Returns the registration of an entity for debugging, or null if the entity is not in this grid
   */
  public inspect(entity: GameEntity): RangeGridEntry | null {
    const index = this.indices.get(entity)
    if (index === undefined) {
      return null
    }
    const range = Math.sqrt(this.rangeSq[index])
    return {
      cellSize: this.cellSize,
      x: this.x[index],
      y: this.y[index],
      z: this.z[index],
      range,
      deactivateRange: range * Math.sqrt(this.hysteresisSq),
      queued: !!this.queued[index],
    }
  }

  public remove(entity: GameEntity): boolean {
    const index = this.indices.get(entity)
    if (index === undefined) {
      return false
    }
    this.indices.delete(entity)
    // remove from its cell
    const key = this.keys[index]
    const cell = this.cells.get(key)
    const slot = this.slots[index]
    const lastInCell = cell.pop()
    if (lastInCell !== index) {
      cell[slot] = lastInCell
      this.slots[lastInCell] = slot
    }
    if (!cell.length) {
      this.cells.delete(key)
    }

    // move the last entry into the gap
    const last = --this.count
    if (index !== last) {
      this.x[index] = this.x[last]
      this.y[index] = this.y[last]
      this.z[index] = this.z[last]
      this.rangeSq[index] = this.rangeSq[last]
      this.keys[index] = this.keys[last]
      this.slots[index] = this.slots[last]
      this.entities[index] = this.entities[last]
      this.indices.set(this.entities[index], index)
      this.cells.get(this.keys[index])[this.slots[index]] = index
    }
    this.entities.length = this.count

    // indices in the queue are invalid now, re-evaluate
    this.queue.length = 0
    this.queueHead = 0
    this.queued.fill(0)
    this.dirty = true
    return true
  }

  /**
   * Deactivates entities that left the neighborhood of the camera, tests the entities around the camera
   * and queues the ones that are in range for activation
   *
   * @param stopped - the camera did not move since the last frame, re-evaluates once at the rest position
   */
  public update(x: number, y: number, z: number, stopped: boolean) {
    const ix = Math.floor(x * this.invCellSize)
    const iy = Math.floor(y * this.invCellSize)
    if (ix !== this.cellX || iy !== this.cellY) {
      if (this.cellX === this.cellX) {
        this.leaveCells(this.cellX, this.cellY, ix, iy)
      }
      this.cellX = ix
      this.cellY = iy
      this.dirty = true
    }

    if (!this.dirty) {
      const dx = x - this.evalX
      const dy = y - this.evalY
      const dz = z - this.evalZ
      const distanceSq = dx * dx + dy * dy + dz * dz
      if (distanceSq < this.updateDistanceSq && !(stopped && distanceSq > 0)) {
        return
      }
    }
    this.dirty = false
    this.evalX = x
    this.evalY = y
    this.evalZ = z
    this.stats.evaluations++

    for (let cy = iy - 1; cy <= iy + 1; cy++) {
      for (let cx = ix - 1; cx <= ix + 1; cx++) {
        const cell = this.cells.get(cellKey(cx, cy))
        if (cell) {
          this.testCell(cell, x, y, z)
        }
      }
    }
  }

  /**
   * Activates queued entities until the deadline is reached
   *
   * @returns true if the queue is empty
   */
  public drain(x: number, y: number, z: number, deadline: number): boolean {
    const queue = this.queue
    while (this.queueHead < queue.length) {
      const index = queue[this.queueHead++]
      this.queued[index] = 0
      // the camera may have moved since the entity was queued
      const dx = this.x[index] - x
      const dy = this.y[index] - y
      const dz = this.z[index] - z
      if (dx * dx + dy * dy + dz * dz > this.rangeSq[index]) {
        continue
      }
      const entity = this.entities[index]
      if (entity.canInitialize) {
        entity.initialize()
      }
      if (entity.canActivate) {
        entity.activate()
        this.stats.activated++
      }
      if ((this.queueHead & 7) === 0 && performance.now() > deadline) {
        break
      }
    }
    if (this.queueHead < queue.length) {
      return false
    }
    queue.length = 0
    this.queueHead = 0
    return true
  }

  private testCell(cell: number[], x: number, y: number, z: number) {
    for (let i = 0; i < cell.length; i++) {
      const index = cell[i]
      const dx = this.x[index] - x
      const dy = this.y[index] - y
      const dz = this.z[index] - z
      const distanceSq = dx * dx + dy * dy + dz * dz
      const rangeSq = this.rangeSq[index]
      const entity = this.entities[index]
      if (distanceSq <= rangeSq) {
        if (!entity.isActive && !this.queued[index]) {
          this.queued[index] = 1
          this.queue.push(index)
        }
      } else if (distanceSq > rangeSq * this.hysteresisSq && entity.canDeactivate) {
        entity.deactivate()
        this.stats.deactivated++
      }
    }
    this.stats.tested += cell.length
  }

  /**
   * Deactivates all entities in the cells around (fromX, fromY) that are not around (toX, toY)
   */
  private leaveCells(fromX: number, fromY: number, toX: number, toY: number) {
    for (let cy = fromY - 1; cy <= fromY + 1; cy++) {
      for (let cx = fromX - 1; cx <= fromX + 1; cx++) {
        if (Math.abs(cx - toX) <= 1 && Math.abs(cy - toY) <= 1) {
          continue
        }
        const cell = this.cells.get(cellKey(cx, cy))
        if (!cell) {
          continue
        }
        for (let i = 0; i < cell.length; i++) {
          const entity = this.entities[cell[i]]
          if (entity.canDeactivate) {
            entity.deactivate()
            this.stats.deactivated++
          }
        }
      }
    }
  }

  private grow(size: number) {
    this.x = growFloat32(this.x, size)
    this.y = growFloat32(this.y, size)
    this.z = growFloat32(this.z, size)
    this.rangeSq = growFloat32(this.rangeSq, size)
    const keys = new Float64Array(size)
    keys.set(this.keys)
    this.keys = keys
    const slots = new Int32Array(size)
    slots.set(this.slots)
    this.slots = slots
    const queued = new Uint8Array(size)
    queued.set(this.queued)
    this.queued = queued
  }
}

function growFloat32(array: Float32Array, size: number) {
  const result = new Float32Array(size)
  result.set(array)
  return result
}
