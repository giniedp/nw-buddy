import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { mat4GetTranslation, vec3 } from '@gglib/math'
import {
  VEGETATION_CELL_UPLOADS_PER_FRAME,
  VEGETATION_LOAD_MARGIN,
  VEGETATION_UNLOAD_MARGIN,
  VEGETATION_VISIBLE_DISTANCE,
} from '../../constants'
import type { VegetationCell } from './parseVegetation'
import { VegetationComponent } from './VegetationComponent'

const LOAD_DISTANCE = VEGETATION_VISIBLE_DISTANCE + VEGETATION_LOAD_MARGIN
const UNLOAD_DISTANCE = VEGETATION_VISIBLE_DISTANCE + VEGETATION_UNLOAD_MARGIN

const cameraPosition = vec3()

/**
 * Streams the vegetation cells around the camera and culls the vegetation on the GPU before each frame.
 */
export class VegetationSystem extends GameSystem {
  private allVegetation: GameQuery
  private game: EcsGame
  private pending: Array<{ cell: VegetationCell; distance: number }> = []

  public initialize(world: GameWorld): void {
    this.allVegetation = world.query({ scope: 'active', required: [VegetationComponent] })
    this.game = world.getSystem(EcsGame)
  }

  public update() {
    const camera = this.game.scene.getView(0).camera
    mat4GetTranslation(camera.world, cameraPosition)
    for (const entity of this.allVegetation) {
      this.updateCells(entity.component(VegetationComponent))
    }
    this.cull()
  }

  private updateCells(vegetation: VegetationComponent) {
    const { origin, regionSize } = vegetation.options
    if (!vegetation.isLoadRequested) {
      const dx = Math.max(origin.x - cameraPosition.x, 0, cameraPosition.x - (origin.x + regionSize))
      const dy = Math.max(origin.y - cameraPosition.y, 0, cameraPosition.y - (origin.y + regionSize))
      if (dx * dx + dy * dy <= LOAD_DISTANCE * LOAD_DISTANCE) {
        vegetation.load()
      }
      return
    }
    const batch = vegetation.ensureBatch()
    if (!batch) {
      return
    }
    const file = vegetation.file
    const cellSize = file.tileSize
    const camX = cameraPosition.x - origin.x
    const camY = cameraPosition.y - origin.y

    // unload far cells first to free slots
    for (const cell of [...batch.loadedCells]) {
      if (cellDistance(cell, cellSize, camX, camY) > UNLOAD_DISTANCE) {
        batch.unloadCell(cell)
      }
    }

    // collect missing cells in range
    const pending = this.pending
    pending.length = 0
    const n = file.cellsPerAxis
    const x0 = Math.max(0, Math.floor((camX - LOAD_DISTANCE) / cellSize))
    const x1 = Math.min(n - 1, Math.floor((camX + LOAD_DISTANCE) / cellSize))
    const y0 = Math.max(0, Math.floor((camY - LOAD_DISTANCE) / cellSize))
    const y1 = Math.min(n - 1, Math.floor((camY + LOAD_DISTANCE) / cellSize))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const cell = file.cellByIndex.get(y * n + x)
        if (!cell || batch.isCellLoaded(cell)) {
          continue
        }
        const distance = cellDistance(cell, cellSize, camX, camY)
        if (distance <= LOAD_DISTANCE) {
          pending.push({ cell, distance })
        }
      }
    }
    if (!pending.length) {
      return
    }

    // nearest first, limited per frame
    pending.sort((a, b) => a.distance - b.distance)
    const count = Math.min(pending.length, VEGETATION_CELL_UPLOADS_PER_FRAME)
    for (let i = 0; i < count; i++) {
      const cell = pending[i].cell
      if (!batch.loadCell(cell)) {
        console.warn('vegetation slots exhausted', vegetation.options.regionName)
        break
      }
      vegetation.requestCellModels(cell)
    }
  }

  public destroy(): void {}

  private cull() {
    const camera = this.game.scene.getView(0).camera
    mat4GetTranslation(camera.world, cameraPosition)
    for (const entity of this.allVegetation) {
      entity.component(VegetationComponent).batch?.cull({
        view: camera.view,
        projection: camera.projection,
        cameraPosition,
        visibleDistance: VEGETATION_VISIBLE_DISTANCE,
      })
    }
  }
}

/**
 * 2D distance from a region local position to the cell rectangle
 */
function cellDistance(cell: VegetationCell, cellSize: number, x: number, y: number) {
  const minX = cell.x * cellSize
  const minY = cell.y * cellSize
  const dx = Math.max(minX - x, 0, x - (minX + cellSize))
  const dy = Math.max(minY - y, 0, y - (minY + cellSize))
  return Math.sqrt(dx * dx + dy * dy)
}
