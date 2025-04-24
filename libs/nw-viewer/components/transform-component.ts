import { Matrix, TransformNode } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../ecs'
import { SceneProvider } from '../services/scene-provider'

export interface TransformComponentOptions {
  name?: string
  transform?: TransformNode
}

export class TransformComponent implements GameComponent {
  private name: string
  private transform: TransformNode

  public entity: GameEntity
  public get node() {
    return this.transform
  }

  public constructor(options?: TransformComponentOptions) {
    this.name = options?.name || ''
    this.transform = options?.transform
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    if (!this.transform) {
      const scene = entity.service(SceneProvider).main
      this.transform = new TransformNode(this.name, scene)
    }
  }

  public activate(): void {
    this.node.setEnabled(true)
  }

  public deactivate(): void {
    this.node.setEnabled(false)
  }

  public destroy(): void {
    this.node.dispose()
  }

  public createChild(name: string, options?: CreateChildTransformOptions) {
    return createChildTransform(this.node, name, options)
  }
}

export interface CreateChildTransformOptions {
  /**
   * The transform matrix to apply to the child node.
   */
  matrix: Matrix
  /**
   * Whether the given matrix is in absolute world coordinates.
   */
  isAbsolute?: boolean
}
export function createChildTransform(parent: TransformNode, name: string, options?: CreateChildTransformOptions) {
  const child = new TransformNode(name, parent.getScene())
  if (options?.matrix) {
    options.matrix.decomposeToTransformNode(child)
  }
  if (options?.isAbsolute) {
    child.setParent(parent)
  } else {
    child.parent = parent
  }
  return child
}
