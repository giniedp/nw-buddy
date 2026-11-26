import { EcsGame } from '@gglib/components'
import { GameSystem, type GameEntity, type GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, vec3, type IVec3 } from '@gglib/math'
import {
  RANGE_ACTIVATION_BUDGET_MS,
  RANGE_CLASS_MAX,
  RANGE_CLASS_MIN,
  RANGE_HYSTERESIS,
  RANGE_UPDATE_DISTANCE_FACTOR,
} from '../../constants'
import { RangeGrid, type RangeGridEntry } from './RangeGrid'

/**
 * Activates entities that are within their view distance of the camera and deactivates the others.
 *
 * Entities are bucketed by range into power of two classes from RANGE_CLASS_MIN to RANGE_CLASS_MAX.
 * Each class is a sparse grid with the class range as cell size, see {@link RangeGrid}.
 * Activations are processed nearest class first within a time budget per frame, deactivations immediately.
 */
export class RangeActivationSystem extends GameSystem {
  public readonly grids: RangeGrid[] = []
  /**
   * Accumulated update time in ms and number of updates, for measurements
   */
  public readonly timing = { time: 0, frames: 0 }

  private game: EcsGame
  private camera = vec3()
  private lastCamera = vec3(Infinity, Infinity, Infinity)
  private minExponent = Math.log2(RANGE_CLASS_MIN)

  public constructor() {
    super()
    for (let size = RANGE_CLASS_MIN; size <= RANGE_CLASS_MAX; size *= 2) {
      this.grids.push(
        new RangeGrid({
          cellSize: size,
          hysteresis: RANGE_HYSTERESIS,
          updateDistanceFactor: RANGE_UPDATE_DISTANCE_FACTOR,
        }),
      )
    }
  }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
  }

  /**
   * Number of entities waiting for activation
   */
  public get pending() {
    let result = 0
    for (const grid of this.grids) {
      result += grid.pending
    }
    return result
  }

  /**
   * Registers an entity for range activation. The entity is expected to be inactive.
   */
  public add(entity: GameEntity, range: number) {
    if (!(range > 0)) {
      return
    }
    range = Math.min(range, RANGE_CLASS_MAX)
    const position = mat4GetTranslation(entity.getTransform().world, vec3.$0)
    const index = Math.max(0, Math.ceil(Math.log2(range)) - this.minExponent)
    this.grids[Math.min(index, this.grids.length - 1)].add(entity, position.x, position.y, position.z, range)
  }

  /**
   * Changes the position and range of a registered entity, e.g. to the bounds of its mesh once it has loaded.
   * Moves it in place when the range stays within its class, otherwise into the grid of the new class.
   *
   * @returns false if the entity is not registered
   */
  public move(entity: GameEntity, position: IVec3, range: number): boolean {
    if (!(range > 0)) {
      return false
    }
    range = Math.min(range, RANGE_CLASS_MAX)
    const index = Math.max(0, Math.ceil(Math.log2(range)) - this.minExponent)
    const target = this.grids[Math.min(index, this.grids.length - 1)]
    for (const grid of this.grids) {
      if (grid.cellSize < range) {
        if (grid.remove(entity)) {
          target.add(entity, position.x, position.y, position.z, range)
          return true
        }
        continue
      }
      if (grid.move(entity, position.x, position.y, position.z, range)) {
        return true
      }
    }
    return false
  }

  /**
   * Returns the registration of an entity for debugging, or null if the entity is not registered
   */
  public inspect(entity: GameEntity): RangeGridEntry | null {
    for (const grid of this.grids) {
      const entry = grid.inspect(entity)
      if (entry) {
        return entry
      }
    }
    return null
  }

  /**
   * Camera position of the last update
   */
  public get cameraPosition(): Readonly<IVec3> {
    return this.camera
  }

  public remove(entity: GameEntity) {
    for (const grid of this.grids) {
      if (grid.remove(entity)) {
        return
      }
    }
  }

  public update() {
    const start = performance.now()
    const view = this.game.scene.getView(0)
    const camera = mat4GetTranslation(view.camera.world, this.camera)

    const last = this.lastCamera
    const stopped = camera.x === last.x && camera.y === last.y && camera.z === last.z
    last.x = camera.x
    last.y = camera.y
    last.z = camera.z

    for (const grid of this.grids) {
      grid.update(camera.x, camera.y, camera.z, stopped)
    }
    const deadline = start + RANGE_ACTIVATION_BUDGET_MS
    for (const grid of this.grids) {
      if (!grid.drain(camera.x, camera.y, camera.z, deadline)) {
        break
      }
    }

    this.timing.time += performance.now() - start
    this.timing.frames++
  }

  public destroy(): void {
    //
  }
}
