import { BoxGeometry, BufferGeometry, Color, Material, MeshBasicMaterial, Object3D, SphereGeometry } from 'three'
import { GameService, GameServiceContainer } from '../../ecs'
import { RendererProvider } from '../../three/services/renderer-provider'
import { InstancedMesh, InstancedMeshRef } from '../graphics/instanced-mesh'
import { SceneProvider } from '../services/scene-provider'
export type DebugShapeType = 'sphere' | 'box' | 'ground'

export class InstancedMeshProvider implements GameService {
  private shapes: Record<string, InstancedMesh[]> = {} as any
  private meshes = new Map<Object3D, Map<BufferGeometry, InstancedMesh>>()

  private three: RendererProvider
  private scene: SceneProvider
  private parent: Object3D
  private isRoot = false
  public game: GameServiceContainer

  public constructor(parentOrName?: Object3D | string) {
    if (typeof parentOrName === 'string') {
      this.parent = new Object3D()
      this.parent.name = parentOrName
      this.isRoot = true
    } else if (parentOrName instanceof Object3D) {
      this.parent = parentOrName
    } else {
      this.parent = new Object3D()
      this.isRoot = true
    }
  }

  public initialize(game: GameServiceContainer): void {
    this.game = game
    this.three = game.get(RendererProvider)
    this.scene = game.get(SceneProvider)
    if (this.isRoot) {
      this.scene.main.attach(this.parent)
    }
    this.three.onUpdate.add(this.update)
  }

  public destroy(): void {
    this.three.onDraw.remove(this.update)
    for (const key in this.shapes) {
      for (const mesh of this.shapes[key]) {
        mesh.dispose()
      }
    }

    this.shapes = {} as any
    this.meshes.forEach((bucket) => {
      bucket.forEach((mesh) => {
        mesh.dispose()
      })
    })
  }

  public instantiateShape(type: DebugShapeType): InstancedMeshRef {
    if (!this.shapes[type]) {
      this.shapes[type] = []
    }
    // find a collection that has capacity to create an instance
    let result: InstancedMeshRef
    for (const collection of this.shapes[type]) {
      result = collection.createRef()
      if (result) {
        return result
      }
    }
    // no capacity, create a new collection
    const mesh = this.createShape(type)
    this.shapes[type].push(mesh)
    return mesh.createRef()
  }

  private update = () => {
    for (const key in this.shapes) {
      for (const mesh of this.shapes[key]) {
        mesh.update()
      }
    }
    this.meshes.forEach(updateModel)
  }

  private createShape(type: DebugShapeType) {
    let geometry: BufferGeometry
    let material: MeshBasicMaterial
    switch (type) {
      case 'sphere':
        geometry = new SphereGeometry(1, 8, 8)
        material = new MeshBasicMaterial({ color: new Color(1, 1, 1) })
        material.wireframe = true
        break
      case 'box':
        geometry = new BoxGeometry(1, 1, 1)
        material = new MeshBasicMaterial({ color: new Color(1, 1, 1) })
        material.opacity = 0.5
        break
      case 'ground':
        geometry = new BoxGeometry(1, 0, 1)
        material = new MeshBasicMaterial({ color: new Color(0.2, 0.2, 0.2) })
        material.opacity = 0.5
        break
      default:
        throw new Error(`Unknown debug shape type: ${type}`)
    }

    const mesh = new InstancedMesh({
      geometry,
      material,
      capacity: 64,
      autoGrow: 64,
      colored: true,
    })
    material.fog = false
    mesh.name = type
    this.parent.add(mesh)
    return mesh
  }
}

function updateModel(map: Map<any, InstancedMesh>) {
  map.forEach(updateMesh)
}

function updateMesh(mesh: InstancedMesh) {
  mesh.update()
}
