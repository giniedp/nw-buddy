import { Matrix4, Object3D, Sphere, Vector3 } from 'three'
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
  userData?: Record<string, any>
  maxDistance?: number
}

export function createTransform(options: CreateTransformOptions) {
  const child = options.node || new Transform()
  attachUserData(child, options.userData)
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

function attachUserData(
  target: Transform,
  userData: Record<string, any>
) {
  if (!userData) {
    return target
  }
  target.userData ||= {}
  for (const key in userData) {
    target.userData[key] = userData[key]
  }
  return target
}

export class TransformComponent implements GameComponent {
  private isRoot = true
  private scene: SceneProvider
  private options: CreateTransformOptions

  public readonly maxDistance: number
  public readonly maxDistanceSq: number
  public readonly entity: GameEntity
  public readonly node: Transform
  public distance = 0
  public distanceSq = 0
  public worldSphere: Sphere

  public constructor(options: CreateTransformOptions) {
    this.options = options || {}
    this.maxDistance = options.maxDistance || 0
    this.maxDistanceSq = (this.maxDistance * this.maxDistance)
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
    if (this.maxDistanceSq) {
      this.scene.renderer.onDraw.add(this.updateDistance)
    }
  }

  public deactivate(): void {
    this.node.disabled = true
    if (this.isRoot) {
      this.scene.main.remove(this.node)
    }
    if (this.maxDistanceSq) {
      this.scene.renderer.onDraw.remove(this.updateDistance)
    }
  }

  public destroy(): void {
    this.node.removeFromParent()
  }

  private updateDistance = () => {
    const cam = this.scene.camera
    const node = this.node
    const position = v
    let radius = 0
    if (this.worldSphere) {
      position.copy(this.worldSphere.center)
      radius = this.worldSphere.radius
    } else {
      position.setFromMatrixPosition(node.matrixWorld)
      radius = 1
    }

    const dx = cam.matrixWorld.elements[12] - position.x
    const dy = cam.matrixWorld.elements[13] - position.y
    const dz = cam.matrixWorld.elements[14] - position.z
    const r2 = radius * radius
    const d2 = dx * dx + dy * dy + dz * dz
    this.distanceSq = d2 - r2
    this.distance = Math.sqrt(this.distanceSq)

    const isVisible = this.maxDistanceSq <= this.maxDistanceSq
    if (node.disabled && isVisible) {
      node.disabled = false
      updateVisibility(node, true)
    } else if (!node.disabled && !isVisible) {
      node.disabled = true
      updateVisibility(node, false)
    }
  }
}
const v = new Vector3()

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}

function updateVisibility(node: Object3D, visible: boolean) {
  node.visible = visible
  for (const child of node.children) {
    child.visible = visible
    // setVisibility(child, visible)
  }
}
