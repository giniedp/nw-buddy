import { InstantiatedEntries, TransformNode } from '@babylonjs/core'
import { BehaviorSubject, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { AnimationFile } from '../adb'
import { GameComponent, GameEntity } from '../ecs'
import { ContentProvider, ContentSource, GltfAsset } from '../services/content-provider'

export type SkinnedMeshComponentOptions = ContentSource & {
  position?: { x: number; y: number; z: number }
}

export class SkinnedMeshComponent implements GameComponent {
  #instance$ = new BehaviorSubject<InstantiatedEntries>(null)
  #animationList$ = new BehaviorSubject<AnimationFile[]>(null)

  private content: ContentProvider
  private disable$ = new Subject<void>()
  private options: SkinnedMeshComponentOptions
  private options$ = new ReplaySubject<SkinnedMeshComponentOptions>(1)
  private url$ = this.options$.pipe(switchMap((options) => this.content.resolveModelUrl(options)))

  public entity: GameEntity

  public instance$ = this.#instance$.asObservable()
  public animationList$ = this.#animationList$.asObservable()

  public constructor(options?: SkinnedMeshComponentOptions) {
    if (options) {
      this.setOptions(options)
    }
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.content = entity.game.system(ContentProvider)
  }

  public activate(): void {
    this.url$
      .pipe(switchMap(({ url, rootUrl }) => this.content.streamAsset(url, rootUrl)))
      .pipe(takeUntil(this.disable$))
      .subscribe({
        next: (asset) => this.onAssetLoaded(asset),
        complete: () => {
          this.#instance$.value?.dispose()
          this.#instance$.next(null)
        },
      })
  }

  public deactivate(): void {
    this.disable$.next()
  }

  public destroy(): void {
    //
  }

  public setOptions(options: SkinnedMeshComponentOptions): void {
    this.options = options
    this.options$.next(options)
  }

  private onAssetLoaded(asset: GltfAsset): void {
    if (!asset) {
      this.#instance$.next(null)
      this.#animationList$.next(null)
      return
    }

    const instance = asset.container.instantiateModelsToScene()
    const animationList = asset.document.json['extras']?.['animationList'] || []
    if (this.options.position) {
      placeInstance(instance, this.options.position)
    }
    this.#instance$.next(instance)
    this.#animationList$.next(animationList)
  }
}

function placeInstance(instance: InstantiatedEntries, position: { x: number; y: number; z: number }): void {
  if (!position || !instance) {
    return
  }
  for (const node of instance.rootNodes) {
    if (node instanceof TransformNode) {
      node.position.set(position.x, position.y, position.z)
    }
  }
}
