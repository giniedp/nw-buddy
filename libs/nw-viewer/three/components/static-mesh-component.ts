import { filter, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { AxesHelper, Box3, Box3Helper, Matrix4, Mesh, Object3D, Sphere } from 'three'
import { GameComponent, GameEntity } from '../../ecs'
import { InstancedModel, InstancedModelRef } from '../graphics/instanced-model'
import { SphereHelper } from '../graphics/sphere-helper'
import { ContentProvider, ModelAsset } from '../services/content-provider'
import { GridProvider } from '../services/grid-provider'
import { RendererProvider } from '../services/renderer-provider'
import { SceneProvider } from '../services/scene-provider'
import { TransformComponent } from './transform-component'
import { EventEmitter } from '../core'

export type StaticMeshComponentOptions = {
  model?: string
  rootUrl?: string
  material?: string
  instances?: Matrix4[]
}

export class StaticMeshComponent implements GameComponent {
  private content: ContentProvider
  private transform: TransformComponent
  private scene: SceneProvider
  private renderer: RendererProvider
  private grid: GridProvider
  private options: StaticMeshComponentOptions
  private instanceModel: InstancedModel
  private instances: InstancedModelRef[] = []
  private meshes: Mesh[] = []
  private model: Object3D

  private axes: AxesHelper

  private boxWorld: Box3
  private box: Box3Helper
  private sphere: SphereHelper
  private worldSphere: Sphere

  private disable$ = new Subject<void>()
  private active = false
  private options$ = new ReplaySubject<StaticMeshComponentOptions>(1)
  private emitter = new EventEmitter()
  // private meshes: AbstractMesh[] = []

  public entity: GameEntity
  public onLoad = this.emitter.createObserver<void>('load')
  public onError = this.emitter.createObserver<void>('error')

  public constructor(options?: StaticMeshComponentOptions) {
    this.options = options
    this.options$.next(options)
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = entity.component(TransformComponent)
    this.content = entity.service(ContentProvider)
    this.scene = entity.service(SceneProvider)
    this.renderer = entity.service(RendererProvider)
    this.grid = entity.service(GridProvider, { optional: true })
  }

  public activate(): void {
    this.active = true
    this.options$
      .pipe(
        filter((it) => !!it?.model),
        map((it) => this.content.modelSource(it.model, it.material, it.rootUrl)),
        filter((it) => !!it),
        switchMap((it) => this.content.streamAsset(it.url, it.rootUrl)),
        filter((it) => !!it),
        takeUntil(this.disable$),
      )
      .subscribe({
        next: (asset) => {
          this.onAssetLoaded(asset)
          this.onLoad.trigger()
        },
        error: () => {
          this.onError.trigger()
        },
      })
  }

  public deactivate(): void {
    this.active = false
    this.disable$.next()
    this.unload()
  }

  public destroy(): void {
    this.unload()
  }

  private onAssetLoaded(asset: ModelAsset) {
    this.unload()
    if (!this.active || !asset) {
      return
    }

    const model = asset.gltf.scene
    removeShadowObjects(model)
    if (this.options.instances?.length) {
      this.cloneAndAddInstances(model, this.options.instances, asset.source)
    } else {
      // this.cloneAndAddModel(model)
      this.cloneAndAddMeshes(model, asset.source)
    }
    if (this.worldSphere) {
      this.transform.worldSphere ||= new Sphere()
      this.transform.worldSphere.copy(this.worldSphere)
    }
    // this.axes = new AxesHelper(1)
    // this.transform.node.add(this.axes)
  }

  private cloneAndAddModel(model: Object3D) {
    this.model = model.clone(true)
    this.transform.node.add(this.model)
    this.model.updateMatrixWorld()
  }

  private cloneAndAddMeshes(model: Object3D, sourceTag?: string) {
    const box = new Box3()
    const sphere = new Sphere()
    box.makeEmpty()
    sphere.makeEmpty()

    this.meshes = cloneMeshes(model)
    for (const mesh of this.meshes) {
      this.transform.node.add(mesh)
      mesh.updateMatrixWorld()
      mesh.geometry.computeBoundingBox()
      mesh.geometry.computeBoundingSphere()
      box.union(mesh.geometry.boundingBox)
      sphere.union(mesh.geometry.boundingSphere)

      mesh.userData ||= {}
      mesh.userData['source'] = sourceTag
    }

    // this.createBoxHelper(box, 0x00ff00)
    // this.createSphereHelper(sphere, 0x00ff00)
    this.setWorldSphere(sphere)
    this.setWorldBox(box)
  }

  private cloneAndAddInstances(model: Object3D, instances: Matrix4[], sourceTag?: string) {
    this.instanceModel = new InstancedModel(model, instances.length, 0)
    this.instanceModel.userData ||= {}
    this.instanceModel.userData['source'] = sourceTag
    this.transform.node.add(this.instanceModel)
    this.instanceModel.updateMatrixWorld()
    this.instances = []
    for (const matrix of instances) {
      const instance = this.instanceModel.createInstance(matrix)
      this.instances.push(instance)
    }
    this.instanceModel.update()
    // this.createBoxHelper(this.instanceModel.boundingBox)
    // this.createSphereHelper(this.instanceModel.boundingSphere)
    this.setWorldSphere(this.instanceModel.boundingSphere)
    this.setWorldBox(this.instanceModel.boundingBox)
  }

  private createBoxHelper(box: Box3, color?: number) {
    this.box = new Box3Helper(box, color)
    this.transform.node.add(this.box)
    this.box.updateMatrixWorld()
  }

  private createSphereHelper(sphere: Sphere, color?: number) {
    this.sphere = new SphereHelper(sphere, color)
    this.transform.node.add(this.sphere)
    this.sphere.updateMatrixWorld()
  }

  private setWorldSphere(localSphere: Sphere) {
    this.worldSphere = localSphere.clone()
    this.worldSphere.applyMatrix4(this.transform.node.matrixWorld)
  }

  private setWorldBox(localBox: Box3) {
    this.boxWorld = localBox.clone()
    this.boxWorld.applyMatrix4(this.transform.node.matrixWorld)
    this.grid?.notifyBoxAdded(this.boxWorld)
  }

  private unload() {
    if (this.meshes) {
      for (const mesh of this.meshes) {
        mesh.removeFromParent()
      }
      this.meshes = null
    }

    if (this.instances) {
      for (const instance of this.instances) {
        instance.dispose()
      }
      this.instances = null
    }

    if (this.instanceModel) {
      this.instanceModel.removeFromParent()
      this.instanceModel.dispose()
      this.instanceModel = null
    }

    if (this.model) {
      this.model.removeFromParent()
      this.model = null
    }

    if (this.box) {
      this.box.removeFromParent()
      this.box.dispose()
      this.box = null
    }

    if (this.sphere) {
      this.sphere.removeFromParent()
      this.sphere.dispose()
      this.sphere = null
    }

    if (this.axes) {
      this.axes.removeFromParent()
      this.axes.dispose()
      this.axes = null
    }
  }
}

function cloneMeshes(model: Object3D): Mesh[] {
  const result: Mesh[] = []
  model.traverse((node) => {
    if (!(node instanceof Mesh) || !node.geometry) {
      return
    }
    const mesh = new Mesh(node.geometry, node.material)
    node.updateMatrixWorld()
    node.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale)
    mesh.name = node.name
    mesh.updateMatrixWorld()
    result.push(mesh)
  })
  return result
}

function removeShadowObjects(node: Object3D) {
  const toRemove: Object3D[] = []
  node.traverse((child) => {
    if (child instanceof Mesh) {
      if (isShadowMaterial(child.material)) {
        // child.visible = false
        toRemove.push(child)
      }
      if (isTestMesh(child.geometry?.userData?.['source'])) {
        toRemove.push(child)
      }
    }
  })
  for (const child of toRemove) {
    child.removeFromParent()
  }
}

function isShadowMaterial(material: any) {
  if (Array.isArray(material)) {
    return material.some((it) => isShadow(it.name))
  } else if (material) {
    return isShadow(material.name)
  }
  return false
}

function isShadow(name: string) {
  if (!name) {
    return false
  }
  name = name.toLowerCase()
  return name === 'shadow' || name.includes('shadoww_proxy')
}

function isTestMesh(source: string) {
  if (!source) {
    return false
  }

  return source.toLowerCase().includes('cube_1_meter')
}
