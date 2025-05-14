import { TerrainInfo } from '@nw-serve'
import { Vector3 } from 'three'
import { GameComponent, GameEntity } from '../../../ecs'
import { Clipmap } from '../../graphics/clipmap'
import { SceneProvider } from '../../services/scene-provider'

export interface TerrainComponentOptions {
  data: TerrainInfo
}

const v3 = new Vector3()
export class TerrainComponent implements GameComponent {
  public entity: GameEntity
  private data: TerrainInfo
  private clipmaps: Clipmap[] = []
  private scene: SceneProvider

  public isActive = false
  public constructor(options: TerrainComponentOptions) {
    this.data = options.data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = this.entity.service(SceneProvider)
  }

  public activate(): void {
    if (!this.data || !this.data.mipCount || this.data.oceanLevel < 0) {
      return null
    }

    this.clipmaps = []
    let coarse: Clipmap

    for (let i = this.data.mipCount - 1; i >= 0; i--) {
      const clipmap = new Clipmap({
        index: i,
        vertexPerSide: Math.pow(2, 8) - 1,
        tileSize: this.data.tileSize,
        levelName: this.data.level,
        coarse,
        mountainHeight: this.data.mountainHeight,
      })
      this.clipmaps.push(clipmap)
      this.scene.main.add(clipmap)
      coarse = clipmap
    }
    this.scene.renderer.onDraw.add(this.update)
    this.clipmaps.reverse() // update order from fine to coarse, so the near terrain is loaded first
  }

  public deactivate(): void {
    this.scene.renderer.onDraw.remove(this.update)
    for (const clipmap of this.clipmaps) {
      clipmap.removeFromParent()
      clipmap.dispose()
    }
    this.clipmaps = []
  }

  public destroy(): void {
    //
  }

  private update = () => {
    const camera = this.scene.camera
    const center = v3.setFromMatrixPosition(camera.matrixWorld)
    for (const clipmap of this.clipmaps) {
      clipmap.update(center, this.scene.renderer.renderer)

    }
  }
}
