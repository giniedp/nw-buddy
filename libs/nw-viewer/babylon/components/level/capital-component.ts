import { EntityInfo } from '@nw-serve'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { SceneProvider } from '../../services/scene-provider'
import { TransformComponent } from '../transform-component'
import { SEGMENT_SIZE } from './constants'
import { instantiateEntities } from './instantiate-entities'

export interface CapitalComponentOptions {
  entities: EntityInfo[]
}

interface EntityWithDistance {
  entity: GameEntity
  transform: TransformComponent
  maxDistanceSquared: number
}

export class CapitalComponent implements GameComponent {
  private data: CapitalComponentOptions
  private isLoaded: boolean
  private transform: TransformComponent
  private scene: SceneProvider

  private entities = new GameEntityCollection()
  private entityWithDistance: EntityWithDistance[] = []
  public entity: GameEntity

  public constructor(data: CapitalComponentOptions) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = entity.component(TransformComponent)
    this.scene = entity.service(SceneProvider)
  }

  public activate(): void {
    if (!this.isLoaded) {
      this.isLoaded = true
      instantiateEntities(this.entities, this.data.entities, this.transform, (item, entity) => {
        if (item.maxViewDistance > 0 && item.maxViewDistance < SEGMENT_SIZE * 2) {
          this.entityWithDistance.push({
            entity,
            transform: entity.component(TransformComponent),
            maxDistanceSquared: item.maxViewDistance * item.maxViewDistance,
          })
        }
      })
      this.entities.initialize(this.entity.game)
    }
    this.entities.activate()
    this.scene.main.onBeforeRenderObservable.add(this.update)
  }

  public deactivate(): void {
    this.scene.main.onBeforeRenderObservable.removeCallback(this.update)
    this.entities.deactivate()
  }

  public destroy(): void {
    this.entities.destroy()
  }

  private update = () => {
    const camera = this.scene.main.activeCamera
    if (!camera) return

    const cx = camera.position.x
    const cy = camera.position.y

    for (const item of this.entityWithDistance) {
      const transform = item.transform.node
      const dx = cx - transform.position.x
      const dy = cy - transform.position.y
      const distanceSquared = dx * dx + dy * dy

      if (distanceSquared > item.maxDistanceSquared) {
        item.transform.node.setEnabled(false)
      } else {
        item.transform.node.setEnabled(true)
      }
    }
  }
}
