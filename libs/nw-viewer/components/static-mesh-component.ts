import { InstantiatedEntries, Matrix, Mesh, TransformNode } from '@babylonjs/core'
import { filter, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../ecs'
import { ContentProvider, ContentSource, GltfAsset } from '../services/content-provider'
import { TransformComponent } from './transform-component'
import { SceneProvider } from '@nw-viewer/services/scene-provider'

export type StaticMeshComponentOptions = ContentSource & {
  instances?: Matrix[]
}

export class StaticMeshComponent implements GameComponent {
  private content: ContentProvider
  private transform: TransformComponent
  private scene: SceneProvider

  private disable$ = new Subject<void>()
  private active = false
  private options: StaticMeshComponentOptions
  private options$ = new ReplaySubject<StaticMeshComponentOptions>(1)
  private url$ = this.options$.pipe(switchMap((options) => this.content.resolveModelUrl(options)))
  private models: InstantiatedEntries[] = []
  private meshes: Mesh[] = []

  public entity: GameEntity

  public constructor(options?: StaticMeshComponentOptions) {
    if (options) {
      this.setOptions(options)
    }
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.content = entity.game.system(ContentProvider)
    this.transform = entity.component(TransformComponent)
    this.scene = entity.game.system(SceneProvider)
  }

  public activate(): void {
    this.active = true
    this.url$
      .pipe(
        filter((it) => !!it),
        switchMap(({ url, rootUrl }) => this.content.streamAsset(url, rootUrl)),
        filter((asset) => !!asset),
        takeUntil(this.disable$),
      )
      .subscribe((asset) => this.onAssetLoaded(asset))
  }

  public deactivate(): void {
    this.active = false
    this.disable$.next()
    for (const model of this.models) {
      model.dispose()
    }
    this.models = []
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
      const instance = asset.container.instantiateModelsToScene()
      this.models.push(instance)
      for (const node of instance.rootNodes) {
        if (node instanceof TransformNode) {
          node.parent = this.transform.node
        }
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
    this.scene.onMeshesUpdated()
  }
}
