import { Color4, InstancedMesh, IVector3Like } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../ecs'
import { ContentProvider, DebugShapeType } from '../services/content-provider'
import { TransformComponent } from './transform-component'

export interface DebugMeshComponentOptions {
  name: string
  type: DebugShapeType
  size: number
  position?: IVector3Like
  meta?: any
}

const COLORS = [
  new Color4(0, 0, 1, 1),
  new Color4(0, 1, 0, 1),
  new Color4(0, 1, 1, 1),
  new Color4(1, 0, 0, 1),
  new Color4(1, 0, 1, 1),
  new Color4(1, 1, 0, 1),
  new Color4(1, 1, 1, 1),
]

export class DebugMeshComponent implements GameComponent {
  private options: DebugMeshComponentOptions
  private content: ContentProvider
  private instance: InstancedMesh
  private transform: TransformComponent
  public entity: GameEntity

  public constructor(options: DebugMeshComponentOptions) {
    this.options = options
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.content = entity.system(ContentProvider)
    this.transform = entity.optionalComponent(TransformComponent)
  }

  public activate(): void {
    const i = Math.floor(Math.log2(this.options.size)) % COLORS.length
    const color = COLORS[i]
    this.instance = this.content.debugShape(this.options.type).createInstance('')

    this.instance.setEnabled(true)
    //this.instance.updateColor(color, false)
    if (this.options.size) {
      this.instance.scaling.setAll(this.options.size)
    }
    if (this.options.position) {
      this.instance.position.set(this.options.position.x, this.options.position.y, this.options.position.z)
    }
    if (this.transform) {
      this.instance.parent = this.transform.node
    }
  }

  public deactivate(): void {
    this.instance.setEnabled(false)
    this.instance.dispose()
    this.instance = null
  }

  public destroy(): void {}
}
