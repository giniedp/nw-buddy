import { CreateBox, CreateGround, CreateSphere, Mesh, Scene, StandardMaterial } from '@babylonjs/core'
import { GameService, GameServiceContainer } from '../../../ecs'
import { SceneProvider } from '../scene-provider'
import { DebugShapeCollection, DebugShapeRef } from './debug-shape-collection'

export type DebugShapeType = 'sphere' | 'box' | 'ground'

export class DebugShapeProvider implements GameService {
  private scene: SceneProvider

  private shapes: Record<DebugShapeType, DebugShapeCollection[]> = {} as any
  public game: GameServiceContainer

  public initialize(game: GameServiceContainer): void {
    this.game = game
    this.scene = game.get(SceneProvider)
    this.scene.main.onBeforeRenderObservable.add(this.update)
  }

  public destroy(): void {
    this.scene.main.onBeforeRenderObservable.removeCallback(this.update)
    for (const shape in this.shapes) {
      for (const collection of this.shapes[shape]) {
        collection.dispose()
      }
    }
    this.shapes = {} as any
  }

  public createInstance(type: DebugShapeType): DebugShapeRef {
    if (!this.shapes[type]) {
      this.shapes[type] = []
    }
    // find a collection that has capacity to create an instance
    let result: DebugShapeRef
    for (const collection of this.shapes[type]) {
      result = collection.createInstance()
      if (result) {
        return result
      }
    }
    // no capacity, create a new collection
    const collection = this.createCollection(type)
    this.shapes[type].push(collection)
    return collection.createInstance()
  }

  private update = () => {
    for (const key in this.shapes) {
      for (const collection of this.shapes[key]) {
        collection.update()
      }
    }
  }

  private createCollection(type: DebugShapeType) {
    const scene = this.scene.main
    let mesh: Mesh
    switch (type) {
      case 'sphere':
        mesh = CreateSphere('debug-sphere', { diameter: 1, segments: 2 }, scene)
        mesh.material = createDefaultMaterial(scene)
        break
      case 'box':
        mesh = CreateBox('debug-box', { size: 1 }, scene)
        mesh.material = createDefaultMaterial(scene)
        break
      case 'ground':
        mesh = CreateGround('debug-ground', { width: 1, height: 1 }, scene)
        mesh.material = createGroundMaterial(scene)
        break
      default:
        throw new Error(`Unknown debug shape type: ${type}`)
    }

    return new DebugShapeCollection({
      mesh,
    })
  }
}

function updateCollection(
  item: DebugShapeCollection,
  type: DebugShapeType,
  map: Map<DebugShapeType, DebugShapeCollection>,
) {
  item.update()
  if (item.instanceCount === 0) {
    item.dispose()
    map.delete(type)
  }
}

function createGroundMaterial(scene: Scene) {
  const material = new StandardMaterial('debug-material', scene)
  material.diffuseColor.set(1, 1, 1)
  material.emissiveColor.set(1, 1, 1)
  material.alpha = 0.5
  material.disableLighting = true
  material.wireframe = false
  return material
}

function createDefaultMaterial(scene: Scene) {
  const material = new StandardMaterial('debug-material', scene)
  material.diffuseColor.set(1, 1, 1)
  material.emissiveColor.set(1, 1, 1)
  material.alpha = 0.75
  material.disableLighting = true
  material.wireframe = true
  return material
}
