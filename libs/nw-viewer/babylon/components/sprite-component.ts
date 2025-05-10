import { Sprite } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../../ecs'
import { ContentProvider } from '../services/content-provider'
import { SceneProvider } from '../services/scene-provider'
import { TransformComponent } from './transform-component'

export type SpriteComponentOptions = {
  kind: string
}

export class SpriteComponent implements GameComponent {
  private content: ContentProvider
  private transform: TransformComponent
  private scene: SceneProvider

  private options: SpriteComponentOptions
  private sprite: Sprite
  public entity: GameEntity

  public constructor(options?: SpriteComponentOptions) {
    this.options = options
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = entity.component(TransformComponent)
    this.content = entity.service(ContentProvider)
    this.scene = entity.service(SceneProvider)
  }

  public activate(): void {
    this.sprite = new Sprite(this.options.kind, this.content.spriteVitals)
    this.sprite.width = 1
    this.sprite.height = 1
    const pos = this.transform.node.absolutePosition
    this.sprite.position.x = pos.x
    this.sprite.position.y = pos.y + 2
    this.sprite.position.z = pos.z
  }

  public deactivate(): void {
    this.sprite.dispose()
    this.sprite = null
  }

  public destroy(): void {
    //
  }
}
