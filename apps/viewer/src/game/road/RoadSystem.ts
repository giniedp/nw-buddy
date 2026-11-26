import { GameSystem, type GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, vec3 } from '@gglib/math'
import { TerrainSystem } from '../terrain/TerrainSystem'
import type { RoadComponent } from './RoadComponent'

/**
 * Builds road meshes once the terrain heights below them are available, rivers right away.
 * Roads are built a few per frame to spread the cost.
 */
export class RoadSystem extends GameSystem {
  /**
   * Maximum number of roads built per frame
   */
  public buildBudget = 32

  private terrain: TerrainSystem
  private pending = new Set<RoadComponent>()
  private heightAt = (x: number, y: number) => this.terrain?.heightAt(x, y)

  public initialize(world: GameWorld): void {
    this.terrain = world.getSystem(TerrainSystem, { optional: true })
  }

  public requestBuild(road: RoadComponent) {
    this.pending.add(road)
  }

  public cancelBuild(road: RoadComponent) {
    this.pending.delete(road)
  }

  public get pendingCount() {
    return this.pending.size
  }

  public update(): void {
    let budget = this.buildBudget
    for (const road of this.pending) {
      if (budget <= 0) {
        break
      }
      if (!road.entity?.isActive) {
        continue
      }
      // the terrain under the entity origin must be loaded, roads are small compared to regions
      const origin = mat4GetTranslation(road.entity.getTransform().world, vec3.$0)
      if (!road.isRiver && this.heightAt(origin.x, origin.y) === undefined) {
        continue
      }
      this.pending.delete(road)
      road.build(this.heightAt)
      budget--
    }
  }

  public destroy(): void {
    this.pending.clear()
  }
}
