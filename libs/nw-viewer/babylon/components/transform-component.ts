import { Matrix, TransformNode } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../../ecs'
import { SceneProvider } from '../services/scene-provider'

export interface TransformComponentOptions {
  name?: string
  transform?: TransformNode
}

export class TransformComponent implements GameComponent {
  private scene: SceneProvider
  private name: string
  private transform: TransformNode
  private isRoot: boolean = false
  public entity: GameEntity
  public get node() {
    return this.transform
  }

  public constructor(options?: TransformComponentOptions) {
    this.name = options?.name || ''
    this.transform = options?.transform
  }

  public initialize(entity: GameEntity): void {
    this.scene = entity.service(SceneProvider)
    this.entity = entity
    if (!this.transform) {
      this.transform = new TransformNode(this.name, this.scene.main)
    }
    this.isRoot = !this.transform.parent
  }

  public activate(): void {
    if (this.isRoot) {
      this.scene.main.addTransformNode(this.transform)
    }
    this.node.setEnabled(true)
  }

  public deactivate(): void {
    this.node.setEnabled(false)
    if (this.isRoot) {
      this.scene.main.removeTransformNode(this.transform)
    }
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
