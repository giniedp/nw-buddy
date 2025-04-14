import {
  AssetContainer,
  Color3,
  CreateBox,
  CreateCylinder,
  CreateGround,
  CreateSphere,
  Mesh,
  Scene,
  StandardMaterial,
} from '@babylonjs/core'
import '@babylonjs/loaders'
import { IGLTFLoaderData } from '@babylonjs/loaders'
import { GridMaterial } from '@babylonjs/materials'

import { GameHost, GameSystem } from '../../ecs'

import { SceneProvider } from '../scene-provider'
import { DebugShapeCollection, DebugShapeRef } from './debug-shape-collection'

export interface GltfAsset {
  document: IGLTFLoaderData
  container: AssetContainer
}

export type ContentSource = ContentSourceUrl | ContentSourceAssetId

export interface ContentSourceUrl {
  url: string
  rootUrl?: string
}

export interface ContentSourceAssetId {
  assetId: string
}

export type DebugShapeType = 'box' | 'sphere' | 'cylinder' | 'ground'

export class DebugShapeProvider implements GameSystem {
  private scene: SceneProvider

  private shapes = new Map<DebugShapeType, DebugShapeCollection>()
  public game: GameHost

  public initialize(game: GameHost): void {
    this.game = game
    this.scene = game.system(SceneProvider)
    this.scene.main.onBeforeRenderObservable.add(this.update)
  }

  public destroy(): void {
    this.scene.main.onBeforeRenderObservable.removeCallback(this.update)
    for (const shape of this.shapes.values()) {
      shape.dispose()
    }
    this.shapes.clear()
  }

  public createInstance(type: DebugShapeType): DebugShapeRef {
    return this.getCollection(type).createInstance()
  }

  private update = () => {
    this.shapes.forEach(updateCollection)
  }

  private getCollection(type: DebugShapeType): DebugShapeCollection {
    if (!this.shapes.has(type)) {
      const collection = this.createCollection(type)
      this.shapes.set(type, collection)
    }
    return this.shapes.get(type)
  }

  private createCollection(type: DebugShapeType) {
    const scene = this.scene.main
    let mesh: Mesh
    switch (type) {
      case 'box':
        mesh = CreateBox('debug-box', { size: 1 }, scene)
        mesh.material = createDefaultMaterial(scene)
        break
      case 'sphere':
        mesh = CreateSphere('debug-sphere', { diameter: 1, segments: 8 }, scene)
        mesh.material = createDefaultMaterial(scene)
        break
      case 'ground':
        mesh = CreateGround('debug-ground', { width: 1, height: 1 }, scene)
        mesh.material = createGridMaterial(scene)
        break
      case 'cylinder':
        mesh = CreateCylinder('debug-cylinder', { diameter: 1, height: 1, tessellation: 6 }, scene)
        mesh.material = createDefaultMaterial(scene)
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

function createGridMaterial(scene: Scene) {
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
