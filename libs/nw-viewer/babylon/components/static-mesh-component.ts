import { AbstractMesh, Material, Matrix, Mesh, Node } from '@babylonjs/core'
import { filter, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../../ecs'
import { ContentProvider, GltfAsset } from '../services/content-provider'
import { SceneProvider } from '../services/scene-provider'
import { DebugMeshComponent } from './debug-mesh-component'
import { TransformComponent } from './transform-component'

export type StaticMeshComponentOptions = {
  model: string
  material?: string
  instances?: Matrix[]
  mtl?: Material
}

export class StaticMeshComponent implements GameComponent {
  private content: ContentProvider
  private transform: TransformComponent
  private scene: SceneProvider

  private disable$ = new Subject<void>()
  private active = false
  private options: StaticMeshComponentOptions
  private options$ = new ReplaySubject<StaticMeshComponentOptions>(1)
  private debug: DebugMeshComponent

  private meshes: AbstractMesh[] = []

  public entity: GameEntity

  public constructor(options?: StaticMeshComponentOptions) {
    if (options) {
      this.setOptions(options)
    }
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.transform = entity.component(TransformComponent)
    this.content = entity.service(ContentProvider)
    this.scene = entity.service(SceneProvider)
    this.debug = entity.component(DebugMeshComponent, true)
  }

  public activate(): void {
    this.active = true
    this.options$
      .pipe(
        filter((it) => !!it?.model),
        map((it) => this.content.modelSource(it.model, it.material, null)),
        filter((it) => !!it),
        switchMap((it) => this.content.streamAsset(it.url, it.rootUrl)),
        filter((it) => !!it),
        takeUntil(this.disable$),
      )
      .subscribe((asset) => {
        this.onAssetLoaded(asset)
      })
  }

  public deactivate(): void {
    this.active = false
    this.disable$.next()
    for (const mesh of this.meshes) {
      mesh.dispose()
    }
    this.meshes = []
  }

  public destroy(): void {
    //
  }

  public setOptions(options: StaticMeshComponentOptions): void {
    this.options = options
    this.options$.next(options)
  }

  private onAssetLoaded(asset: GltfAsset) {
    if (!this.active || !asset) {
      return
    }
    //this.content.addFrameTask(() => {

    if (!this.options.instances?.length) {
      for (const mesh of asset.container.meshes) {
        const m = mesh as Mesh
        if (!m.geometry) {
          continue
        }
        const instance = m.createInstance(mesh.name)
        instance.parent = this.transform.createChild(mesh.name, {
          matrix: mesh.getWorldMatrix().clone(),
        })
        this.meshes.push(instance)
      }
    } else {
      const instances = this.options.instances
      const matricesData = new Float32Array(16 * instances.length)
      for (let i = 0; i < instances.length; i++) {
        instances[i].copyToArray(matricesData, i * 16)
      }
      for (const mesh of asset.container.meshes) {
        const clone = new Mesh(mesh.name, asset.container.scene, {
          source: mesh as Mesh,
        })
        clone.parent = this.transform.node
        clone.thinInstanceSetBuffer('matrix', matricesData, 16)
        this.meshes.push(clone)
      }
    }
    const meshes = collectMeshes(this.meshes)
    for (const mesh of meshes) {
      mesh.unfreezeWorldMatrix()
    }
    for (const mesh of meshes) {
      mesh.computeWorldMatrix()
      mesh.cullingStrategy = Mesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
    }
    for (const mesh of meshes) {
      mesh.freezeWorldMatrix()
    }
    //})
  }
}

function collectMeshes(nodes: Node[], meshes: AbstractMesh[] = []): AbstractMesh[] {
  if (!nodes) {
    return meshes
  }
  for (const node of nodes) {
    if (node instanceof AbstractMesh) {
      meshes.push(node)
    }
  }
  return meshes
}
