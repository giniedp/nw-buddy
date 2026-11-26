import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { boxMat4DistanceSquared, mat4GetTranslation, vec3 } from '@gglib/math'
import { IMPOSTOR_VISIBILITY_START } from '../../constants'
import { DistributionComponent } from './DistributionComponent'

const cellMin = vec3()
const cellMax = vec3()
const cameraPosition = vec3()

/**
 * Requests distribution models around the camera and culls the distribution on the GPU before each frame.
 */
export class DistributionSystem extends GameSystem {
  private allDistributions: GameQuery
  private game: EcsGame

  public initialize(world: GameWorld): void {
    this.allDistributions = world.query({ scope: 'active', required: [DistributionComponent] })
    this.game = world.getSystem(EcsGame)
  }

  public update() {
    const camera = this.game.scene.getView(0).camera
    mat4GetTranslation(camera.world, cameraPosition)

    const viewDistanceScale = 1
    const visibleDistance = IMPOSTOR_VISIBILITY_START
    const loadDistance = IMPOSTOR_VISIBILITY_START * 2
    const loadDistanceSquared = loadDistance * loadDistance

    for (const entity of this.allDistributions) {
      const distribution = entity.component(DistributionComponent)
      const batch = distribution.ensureBatch()
      if (!batch) {
        continue
      }

      const origin = distribution.options.origin
      const cellSize = distribution.options.cellSize
      const mountainHeight = distribution.options.mountainHeight

      for (const cell of distribution.cells) {
        cellMin.x = origin.x + cell.x * cellSize
        cellMin.y = origin.y + cell.y * cellSize
        cellMin.z = 0
        cellMax.x = cellMin.x + cellSize
        cellMax.y = cellMin.y + cellSize
        cellMax.z = mountainHeight
        if (boxMat4DistanceSquared(cellMin, cellMax, camera.world) <= loadDistanceSquared) {
          distribution.requestCell(cell)
        }
      }

      // TODO: don't pass new object each frame
      batch.cull({
        view: camera.view,
        projection: camera.projection,
        cameraPosition,
        visibleDistance,
        viewDistanceScale,
      })
    }
  }

  public destroy(): void {
    //
  }
}
