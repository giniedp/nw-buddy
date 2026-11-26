import type { BoundingBox } from '@gglib/math'

const MAX_CELLS = 256

/**
 * Uniform grid over the XY plane (Z is up) that maps cells to the ids of items whose bounds overlap them
 */
export class SpatialGrid {
  private readonly cellSize: number
  private readonly cells = new Map<number, number[]>()
  /**
   * Items that would cover more than MAX_CELLS cells, visited by every query
   */
  private readonly large: number[] = []
  /**
   * Query stamp per id, so items spanning several cells are visited once per query
   */
  private stamps: Uint32Array = new Uint32Array(1024)
  private stamp = 0

  public constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  public insert(id: number, box: BoundingBox) {
    if (this.cellCount(box) > MAX_CELLS) {
      this.large.push(id)
      return
    }
    this.forCells(box.min.x, box.min.y, box.max.x, box.max.y, (key) => {
      let cell = this.cells.get(key)
      if (!cell) {
        cell = []
        this.cells.set(key, cell)
      }
      cell.push(id)
    })
  }

  public remove(id: number, box: BoundingBox) {
    if (this.cellCount(box) > MAX_CELLS) {
      const index = this.large.indexOf(id)
      if (index >= 0) {
        this.large.splice(index, 1)
      }
      return
    }
    this.forCells(box.min.x, box.min.y, box.max.x, box.max.y, (key) => {
      const cell = this.cells.get(key)
      if (!cell) {
        return
      }
      const index = cell.indexOf(id)
      if (index >= 0) {
        cell[index] = cell[cell.length - 1]
        cell.pop()
      }
      if (!cell.length) {
        this.cells.delete(key)
      }
    })
  }

  /**
   * Calls `visit` once for each item in the cells that overlap the XY rectangle
   */
  public query(minX: number, minY: number, maxX: number, maxY: number, visit: (id: number) => void) {
    const stamp = this.nextStamp()
    for (const id of this.large) {
      visit(id)
    }
    this.forCells(minX, minY, maxX, maxY, (key) => {
      const cell = this.cells.get(key)
      if (!cell) {
        return
      }
      for (const id of cell) {
        if (id >= this.stamps.length) {
          this.growStamps(id)
        }
        if (this.stamps[id] !== stamp) {
          this.stamps[id] = stamp
          visit(id)
        }
      }
    })
  }

  private cellCount(box: BoundingBox) {
    const size = this.cellSize
    const nx = Math.floor(box.max.x / size) - Math.floor(box.min.x / size) + 1
    const ny = Math.floor(box.max.y / size) - Math.floor(box.min.y / size) + 1
    return nx * ny
  }

  private nextStamp() {
    this.stamp = (this.stamp + 1) >>> 0
    if (this.stamp === 0) {
      this.stamps.fill(0)
      this.stamp = 1
    }
    return this.stamp
  }

  private growStamps(id: number) {
    const grown = new Uint32Array(Math.max(id + 1, this.stamps.length * 2))
    grown.set(this.stamps)
    this.stamps = grown
  }

  private forCells(minX: number, minY: number, maxX: number, maxY: number, fn: (key: number) => void) {
    const size = this.cellSize
    const x0 = Math.floor(minX / size)
    const y0 = Math.floor(minY / size)
    const x1 = Math.floor(maxX / size)
    const y1 = Math.floor(maxY / size)
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        // cell coordinates fit in 16 bit for world sizes below 16 * 32768 m
        fn((x + 0x8000) * 0x10000 + (y + 0x8000))
      }
    }
  }
}
