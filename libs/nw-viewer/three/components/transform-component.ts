import { Matrix4, Object3D, Vector3 } from 'three'
import { GameComponent, GameEntity } from '../../ecs'
import { SceneProvider } from '../services/scene-provider'

export class Transform extends Object3D {
  public disabled?: boolean
  // matrixAutoUpdate
  // matrixWorldAutoUpdate
  // frustumCulled
}

export interface CreateTransformOptions {
  node?: Transform
  parent?: Transform
  name?: string
  matrix?: Matrix4
  matrixIsWorld?: boolean
}

export function createTransform(options: CreateTransformOptions) {
  const child = options.node || new Transform()
  if (options.name) {
    child.name = options.name
  }
  if (options.matrix) {
    options.matrix.decompose(child.position, child.quaternion, child.scale)
  }
  if (!options.parent) {
    child.updateWorldMatrix(true, false) // calls updateMatrix() due to matrixAutoUpdate=true
    return child
  }
  const parent = options.parent
  if (parent) {
    if (options.matrixIsWorld) {
      parent.updateWorldMatrix(true, false)
      child.updateWorldMatrix(true, false)

      parent.attach(child)
      return child
    }
    parent.updateWorldMatrix(true, false)
    parent.add(child)
  }
  child.updateWorldMatrix(true, false)
  return child
}

export class TransformComponent implements GameComponent {
  private isRoot = true
  private scene: SceneProvider
  private options: CreateTransformOptions

  public readonly entity: GameEntity
  public readonly node: Transform
  public constructor(options: CreateTransformOptions) {
    this.options = options || {}
  }

  public initialize(entity: GameEntity): void {
    setReadOnly(this, 'entity', entity)
    setReadOnly(this, 'node', this.node || createTransform(this.options))
    this.scene = entity.service(SceneProvider)
    this.isRoot = !this.node.parent
  }

  public activate(): void {
    if (this.isRoot) {
      this.scene.main.attach(this.node)
    }
    this.node.disabled = false
    this.node.updateMatrixWorld()
  }

  public deactivate(): void {
    this.node.disabled = true
    if (this.isRoot) {
      this.scene.main.remove(this.node)
    }
  }

  public destroy(): void {
    this.node.removeFromParent()
  }
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}
