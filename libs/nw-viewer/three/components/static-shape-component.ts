import { Color, Matrix4, Vector3 } from 'three'
import { GameComponent, GameEntity } from '../../ecs'
import { InstancedMeshRef } from '../graphics/instanced-mesh'
import { DebugShapeType, InstancedMeshProvider } from '../services/instanced-mesh-provider'
import { TransformComponent } from './transform-component'

export interface StaticShapeComponentOptions {
  type: DebugShapeType
  color?: Color
  scale?: number
}

export class StaticShapeComponent implements GameComponent {
  private options: StaticShapeComponentOptions
  private provider: InstancedMeshProvider
  private instance: InstancedMeshRef
  private transform: TransformComponent
  private color: Color

  public entity: GameEntity

  public constructor(options: StaticShapeComponentOptions) {
    this.options = options
    this.color = options.color || new Color(1, 1, 1)
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.provider = entity.service(InstancedMeshProvider)
    this.transform = entity.component(TransformComponent)
  }

  public activate(): void {
    let matrix: Matrix4
    if (this.transform) {
      this.transform.node.updateMatrixWorld()
      matrix = this.transform.node.matrixWorld.clone()
    } else {
      matrix = new Matrix4()
    }
    if (this.options.scale) {
      matrix.scale(new Vector3(this.options.scale, this.options.scale, this.options.scale))
    }
    this.instance = this.provider.instantiateShape(this.options.type)
    this.instance.updateColor(this.color)
    this.instance.updateTransform(matrix)
  }

  public setColor(color: Color) {
    this.color = color
    this.instance?.updateColor(color)
  }

  public deactivate(): void {
    this.instance?.dispose()
    this.instance = null
  }

  public destroy(): void {
    //
  }
}
