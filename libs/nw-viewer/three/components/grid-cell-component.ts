import { Box3, Box3Helper, Color } from 'three'
import { GameComponent, GameEntity } from '../../ecs'
import { GridProvider } from '../services/grid-provider'
import { SceneProvider } from '../services/scene-provider'

export interface GridCellOptions {
  color?: number
}

export class GridCellComponent implements GameComponent {
  public grid: GridProvider
  public entity: GameEntity

  private boxHelper: Box3Helper
  private box: Box3
  private color: number
  private scene: SceneProvider

  public constructor(options?: GridCellOptions) {

    this.color = options?.color ?? 0x00ff00
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.service(SceneProvider)
    this.grid = entity.service(GridProvider, {
      self: true,
    })

  }

  public activate(): void {
    // this.grid.onBoxAdded.add(this.onBoxAdded)
    // if (this.boxHelper) {
    //   this.scene.main.attach(this.boxHelper)
    // }
  }

  public deactivate(): void {
    // this.grid.onBoxAdded.remove(this.onBoxAdded)
    // if (this.boxHelper) {
    //   this.boxHelper.removeFromParent()
    // }
  }

  public destroy(): void {
    if (this.boxHelper) {
      this.boxHelper.removeFromParent()
      this.boxHelper.dispose()
      this.boxHelper = null
    }
  }

  private onBoxAdded = (box: Box3) => {
    if (!this.box) {
      this.box = new Box3()
      this.box.makeEmpty()
      this.boxHelper = new Box3Helper(this.box, new Color(Math.random(), Math.random(), Math.random()))// this.color)
      this.scene.main.attach(this.boxHelper)
    }
    this.box.union(box)
    this.boxHelper.updateMatrixWorld()
  }
}
