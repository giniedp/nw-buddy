import { Color4, IVector3Like, Matrix, TransformNode } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../../ecs'
import { DebugShapeProvider, DebugShapeRef, DebugShapeType } from '../services/debug-shapes'
import { TransformComponent } from './transform-component'

export interface DebugMeshComponentOptions {
  name: string
  type: DebugShapeType
  size: number
  color?: Color4
  position?: IVector3Like
  meta?: any
}

export class DebugMeshComponent implements GameComponent {
  private options: DebugMeshComponentOptions
  private provider: DebugShapeProvider
  private instance: DebugShapeRef
  private transform: TransformComponent
  private matrix: Matrix
  private color: Color4

  public entity: GameEntity

  public constructor(options: DebugMeshComponentOptions) {
    this.options = options
    this.color = options.color || new Color4(1, 1, 1, 1)
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.provider = entity.service(DebugShapeProvider)
    this.transform = entity.component(TransformComponent, true)
    this.matrix = Matrix.Identity()
  }

  public activate(): void {
    this.instance = this.provider.createInstance(this.options.type)
    this.instance.updateColor(this.color)
    updateTransform(this.transform?.node, this.matrix, this.options)
    this.instance.updateTransform(this.matrix)

    if (this.transform) {
      this.transform.node.onAfterWorldMatrixUpdateObservable.add(this.update)
    }
  }

  public setColor(color: Color4) {
    this.color = color
    if (this.instance) {
      this.instance.updateColor(color)
    }
  }

  public deactivate(): void {
    if (this.transform) {
      this.transform.node.onAfterWorldMatrixUpdateObservable.removeCallback(this.update)
    }
    this.instance.destroy()
    this.instance = null
  }

  public destroy(): void {}

  private update = (node: TransformNode) => {
    updateTransform(node, this.matrix, this.options)
    this.instance.updateTransform(this.matrix)
  }
}

function updateTransform(node: TransformNode, matrix: Matrix, options: DebugMeshComponentOptions) {
  Matrix.IdentityToRef(matrix)
  if (options) {
    if (options.size) {
      Matrix.ScalingToRef(options.size, options.size, options.size, matrix)
    }
    if (options.position) {
      matrix.setTranslationFromFloats(options.position.x, options.position.y, options.position.z)
    }
  }
  if (node) {
    matrix.multiplyToRef(node.getWorldMatrix(), matrix)
  }
}
