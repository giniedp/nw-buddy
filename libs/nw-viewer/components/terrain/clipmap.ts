import { Vector2, Vector3 } from '@babylonjs/core'

export interface ClipmapOptions {
  index: number
  vertexPerSide: number
}

export class Clipmap {
  /**
   * The index of this clipmap
   */
  public readonly index: number
  /**
   * Vertex density. Simply 2^index
   */
  public readonly density: number
  /**
   * Gets the number of vertices per side of the clip. This is always one less than
   * power of two (2^x - 1).
   */
  public readonly clipsize: number

  /**
   * The center of the clipmap geometry
   */
  public readonly center: Vector2 = new Vector2(0, 0)
  /**
   * The origin of the clipmap geometry
   */
  public readonly origin: Vector2 = new Vector2(0, 0)
  /**
   * The movement delta since last update
   */
  public readonly delta: Vector2 = new Vector2(0, 0)

  public constructor(options: ClipmapOptions) {
    this.index = options.index
    this.density = Math.pow(2, options.index)
    this.clipsize = options.vertexPerSide
  }

  public update(center: Vector3) {
    // snap camera position
    const d2 = this.density * 2 // next coarser level density
    const snapX = Math.floor(Math.floor(center.x) / d2) * d2
    const snapY = Math.floor(Math.floor(center.z) / d2) * d2

    const cx = snapX + this.density
    const cy = snapY + this.density
    this.delta.set(cx - this.center.x, cy - this.center.y)
    this.center.set(cx, cy)

    this.origin.x = cx - Math.floor(this.clipsize * 0.5) * this.density
    this.origin.y = cy - Math.floor(this.clipsize * 0.5) * this.density
  }
}
