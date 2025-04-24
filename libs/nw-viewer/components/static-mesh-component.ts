import { AbstractMesh, InstancedMesh, InstantiatedEntries, Material, Matrix, Mesh, Node, TransformNode } from '@babylonjs/core'
import { SceneProvider } from '@nw-viewer/services/scene-provider'
import { filter, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../ecs'
import { ContentProvider, GltfAsset } from '../services/content-provider'
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
    freezeMeshes(this.meshes)
  }
}

function freezeMeshes(nodes: Node[]) {
  if (!nodes) {
    return
  }
  for (const node of nodes) {
    if (node instanceof AbstractMesh) {
      node.computeWorldMatrix()
      node.freezeWorldMatrix()
      node.freezeWorldMatrix()
    }
    freezeMeshes(node.getChildren())
  }
}
