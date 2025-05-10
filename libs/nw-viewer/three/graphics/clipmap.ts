import { IVec2, IVec3 } from '../../math'

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
  public readonly size: number

  /**
   * The center of the clipmap geometry
   */
  public readonly center: IVec2 = { x: 0, y: 0 }
  /**
   * The origin of the clipmap geometry
   */
  public readonly origin: IVec2 = { x: 0, y: 0 }
  /**
   * The movement delta since last update
   */
  public readonly delta: IVec2 = { x: 0, y: 0 }

  public constructor(options: ClipmapOptions) {
    this.index = options.index
    this.density = Math.pow(2, options.index)
    this.size = options.vertexPerSide
  }

  public update(center: IVec3) {
    // snap camera position
    const d2 = this.density * 2 // next coarser level density
    const snapX = Math.floor(Math.floor(center.x) / d2) * d2
    const snapY = Math.floor(Math.floor(center.z) / d2) * d2

    const cx = snapX + this.density
    const cy = snapY + this.density
    this.delta.x = cx - this.center.x
    this.delta.y = cy - this.center.y
    this.center.x = cx
    this.center.y = cy

    this.origin.x = cx - Math.floor(this.size * 0.5) * this.density
    this.origin.y = cy - Math.floor(this.size * 0.5) * this.density
  }
}
