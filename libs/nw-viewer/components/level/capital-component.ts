import { GameComponent, GameEntity, GameEntityCollection } from '@nw-viewer/ecs'
import { TransformComponent } from '../transform-component'
import { instantiateEntities } from './instantiate-entities'
import type { CapitalWitEntities } from './region-segment'

export class CapitalComponent implements GameComponent {
  private data: CapitalWitEntities
  private isLoaded: boolean
  private transform: TransformComponent

  private entities = new GameEntityCollection()
  public entity: GameEntity

  public constructor(data: CapitalWitEntities) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = entity.component(TransformComponent)
  }

  public activate(): void {
    if (!this.isLoaded) {
      this.isLoaded = true
      instantiateEntities(this.entities, this.data.entities, this.transform)
      this.entities.initialize(this.entity.game)
    }
    this.entities.activate()
  }

  public deactivate(): void {
    this.entities.deactivate()
  }

  public destroy(): void {
    this.entities.destroy()
  }
}
