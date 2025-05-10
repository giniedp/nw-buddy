import { TerrainInfo } from '@nw-serve'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { LevelProvider } from '../../services/level-provider'
import { TransformComponent } from '../transform-component'
import { ClipmapComponent } from './clipmap-component'

export class TerrainComponent implements GameComponent {
  public entity: GameEntity
  private data: TerrainInfo
  private transform: TransformComponent
  private level: LevelProvider

  private entities = new GameEntityCollection()
  public constructor(data: TerrainInfo) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = this.entity.component(TransformComponent)
    this.level = this.entity.service(LevelProvider)
  }

  public activate(): void {
    this.level.terrainEnabledObserver.add(this.updateTerrain)
    this.updateTerrain()
  }

  public deactivate(): void {
    this.level.terrainEnabledObserver.removeCallback(this.updateTerrain)
    this.entities.deactivate()
    this.entities.destroy()
  }

  public destroy(): void {}

  private updateTerrain = () => {
    if (!this.level.terrainEnabled) {
      this.entities.deactivate()
      this.entities.destroy()
    } else {
      if (!this.entities.length()) {
        this.createClimpaps()
      }
      this.entities.activate()
    }
  }

  private createClimpaps() {
    let prev: ClipmapComponent
    for (let i = this.data.mipCount - 1; i >= 0; i--) {
      const clip = this.entities.create()
      clip.name = `clipmap ${i}`
      clip.addComponent(
        new TransformComponent({
          name: clip.name,
          // just a folder transform
          transform: this.transform.createChild(clip.name),
        }),
      )
      let clipmap = new ClipmapComponent({
        index: i,
        levelName: this.data.level,
        tileSize: this.data.tileSize,
        mountainHeight: this.data.mountainHeight || 0,
        // 2^8 is 256, which is exactly the tile width
        size: 8, // TODO: needs review, doesn't work with anything else
        previous: prev,
      })
      prev = clipmap
      clip.addComponent(clipmap)
    }
    this.entities.initialize(this.entity.game)
  }
}
