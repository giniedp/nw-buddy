import type { BehaviorComponent } from '@gglib/components'
import { WASDComponent } from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { vec3, type IVec3 } from '@gglib/math'

/**
 * What the orbit camera follows: a point in world space each frame, false when it is gone
 */
export interface OrbitFollowTarget {
  focusPoint(out: IVec3): boolean
}

/**
 * Keeps the orbit center of the {@link WASDComponent} on a moving target (e.g. a previewed character whose cutscene
 * clip flies it away from the origin). Orbiting and zooming keep following; the user moving the orbit center (keys,
 * panning) ends it, and so does a target that is gone.
 *
 * @remarks
 * Runs before the WASD component, which places the camera around the center in the same frame.
 */
export class OrbitFollowComponent implements GameComponent, BehaviorComponent {
  public readonly entity: GameEntity
  public readonly behaviorOrder = -1

  private target: OrbitFollowTarget | null = null
  private wasd: WASDComponent
  /**
   * The orbit center this component set last frame: a different one means the user moved it
   */
  private readonly placed = vec3()
  private readonly point = vec3()
  private placedOnce = false

  public initialize(): void {
    this.wasd = this.entity.component(WASDComponent)
  }

  /**
   * Whether the camera follows a target
   */
  public get following(): boolean {
    return !!this.target
  }

  /**
   * Follows a target from the next frame, null stops
   */
  public follow(target: OrbitFollowTarget | null) {
    this.target = target
    this.placedOnce = false
  }

  public updateBehavior(): void {
    const target = this.target
    if (!target) {
      return
    }
    const center = this.wasd.orbitCenter
    if (this.placedOnce && !samePoint(center, this.placed)) {
      // the user moved the camera
      this.target = null
      return
    }
    if (!target.focusPoint(this.point)) {
      this.target = null
      return
    }
    center.x = this.point.x
    center.y = this.point.y
    center.z = this.point.z
    this.placed.x = center.x
    this.placed.y = center.y
    this.placed.z = center.z
    this.placedOnce = true
  }
}

function samePoint(a: IVec3, b: IVec3): boolean {
  return Math.abs(a.x - b.x) < 1e-4 && Math.abs(a.y - b.y) < 1e-4 && Math.abs(a.z - b.z) < 1e-4
}
