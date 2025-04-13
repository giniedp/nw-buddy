import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { HeightmapMetadata } from '../../level/types'
import { TransformComponent } from '../transform-component'
import { ClipmapComponent } from './clipmap-component'

export class TerrainComponent implements GameComponent {
  public entity: GameEntity
  private data: HeightmapMetadata
  private transform: TransformComponent

  private entities = new GameEntityCollection()
  public constructor(data: HeightmapMetadata) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = this.entity.component(TransformComponent)

    const mipCount = this.data.mipCount
    for (let i = 0; i < mipCount; i++) {
      const clip = this.entities.create()
      clip.name = `clipmap ${i}`
      clip.addComponent(new TransformComponent({
        name: clip.name,
        // just a folder transform
        transform: this.transform.createChild(clip.name)
      }))
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

  public activate(): void {
    this.entities.activate()
  }

  public deactivate(): void {
    this.entities.deactivate()
  }

  public destroy(): void {
    this.entities.destroy()
  }
}
