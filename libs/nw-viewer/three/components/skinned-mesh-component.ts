import { filter, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { AxesHelper, Box3, Box3Helper, Mesh, Object3D, SkeletonHelper, SkinnedMesh, Sphere } from 'three'
import { GameComponent, GameEntity } from '../../ecs'
import { AnimationFile } from '../adb'
import { EventEmitter } from '../core'
import { SphereHelper } from '../graphics/sphere-helper'
import { ContentProvider, ModelAsset } from '../services/content-provider'
import { GridProvider } from '../services/grid-provider'
import { RendererProvider } from '../services/renderer-provider'
import { SceneProvider } from '../services/scene-provider'
import { TransformComponent } from './transform-component'

export type SkinnedMeshComponentOptions = {
  model?: string
  rootUrl?: string
  material?: string
  adbFile?: string
  maxDistance?: number
}

export class SkinnedMeshComponent implements GameComponent {
  private scene: SceneProvider
  private content: ContentProvider
  private transform: TransformComponent
  private renderer: RendererProvider
  private grid: GridProvider
  private options: SkinnedMeshComponentOptions

  public meshes: Mesh[] = []
  public model: Object3D

  private axes: AxesHelper

  private boxWorld: Box3
  private box: Box3Helper
  private sphere: SphereHelper
  private worldSphere: Sphere

  private disable$ = new Subject<void>()
  private active = false
  private options$ = new ReplaySubject<SkinnedMeshComponentOptions>(1)
  private emitter = new EventEmitter()

  public entity: GameEntity
  public animationList: AnimationFile[]
  public onLoad = this.emitter.createObserver<void>('load')
  public onError = this.emitter.createObserver<void>('error')

  public constructor(options?: SkinnedMeshComponentOptions) {
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

    this.animationList = asset.animationList

    const model = asset.gltf.scene
    //this.cloneAndAddMeshes(model, asset.source)
    this.cloneAndAddModel(model)
  }

  private cloneAndAddModel(model: Object3D) {
    this.model = model.clone(true)
    this.model.updateMatrix()

    this.transform.node.add(this.model)
    this.model.updateMatrixWorld()
    this.model.frustumCulled = false
    this.model.traverse((node) => {
      if (node instanceof SkinnedMesh) {
        const helper = new SkeletonHelper(node)
        this.scene.main.add(helper)
      }
    })
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

function setVisibility(node: Object3D, visible: boolean) {
  node.visible = visible
  for (const child of node.children) {
    setVisibility(child, visible)
  }
}
