import { InstantiatedEntries, Matrix, TransformNode } from '@babylonjs/core'
import { filter, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../ecs'
import { ContentProvider, ContentSource, GltfAsset } from '../services/content-provider'
import { TransformComponent } from './transform-component'

export type StaticMeshComponentOptions = ContentSource & {
  instances?: Matrix[]
}

export class StaticMeshComponent implements GameComponent {
  private content: ContentProvider
  private transform: TransformComponent
  private disable$ = new Subject<void>()
  private active = false
  private options: StaticMeshComponentOptions
  private options$ = new ReplaySubject<StaticMeshComponentOptions>(1)
  private url$ = this.options$.pipe(switchMap((options) => this.content.resolveModelUrl(options)))
  private models: InstantiatedEntries[] = []
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
      return
    }
    for (const matrix of this.options.instances) {
      const instance = asset.container.instantiateModelsToScene()
      const transform = this.transform.createChild('', {
        matrix,
        isAbsolute: false,
      })
      for (const node of instance.rootNodes) {
        if (node instanceof TransformNode) {
          node.parent = transform
        }
      }
      // console.log('instance', instance, transform)
      this.models.push(instance)
    }
  }
}
