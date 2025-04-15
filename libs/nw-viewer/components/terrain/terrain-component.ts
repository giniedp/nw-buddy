import { LevelProvider } from '@nw-viewer/services/level-provider'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { HeightmapMetadata } from '../level/types'
import { TransformComponent } from '../transform-component'
import { ClipmapComponent } from './clipmap-component'

export class TerrainComponent implements GameComponent {
  public entity: GameEntity
  private data: HeightmapMetadata
  private transform: TransformComponent
  private level: LevelProvider

  private entities = new GameEntityCollection()
  public constructor(data: HeightmapMetadata) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = this.entity.component(TransformComponent)
    this.level = this.entity.game.system(LevelProvider)
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
    const mipCount = this.data.mipCount
    for (let i = 0; i < mipCount; i++) {
      const clip = this.entities.create()
      clip.name = `clipmap ${i}`
      clip.addComponent(
        new TransformComponent({
          name: clip.name,
          // just a folder transform
          transform: this.transform.createChild(clip.name),
        }),
      )
      clip.addComponent(
        new ClipmapComponent({
          index: i,
          data: this.data,
          // 2^8 is 256, which is exactly the tile width
          size: 8, // TODO: needs review, doesn't work with anything else
        }),
      )
    }
    this.entities.initialize(this.entity.game)
  }
}
