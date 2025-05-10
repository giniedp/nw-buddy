import { computeMaxExtents, InstantiatedEntries, Mesh, Node, Observable, TransformNode } from '@babylonjs/core'
import { filter, map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../../ecs'
import { AnimationFile } from '../adb'
import { ContentProvider, GltfAsset } from '../services/content-provider'
import { SceneProvider } from '../services/scene-provider'
import { TransformComponent } from './transform-component'

export type SkinnedMeshComponentOptions = {
  url: string
  rootUrl?: string
}

export class SkinnedMeshComponent implements GameComponent {
  private scene: SceneProvider
  private content: ContentProvider
  private transform: TransformComponent
  private disable$ = new Subject<void>()
  private options$ = new ReplaySubject<SkinnedMeshComponentOptions>(1)
  private meshes: Mesh[] = []

  public instance: InstantiatedEntries
  public animationList: AnimationFile[]
  public entity: GameEntity
  public readonly onDataLoaded = new Observable<{ model: InstantiatedEntries; adb: AnimationFile[] }>()

  public constructor(options?: SkinnedMeshComponentOptions) {
    this.onDataLoaded.notifyIfTriggered = true
    if (options) {
      this.setOptions(options)
    }
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.service(SceneProvider)
    this.content = entity.service(ContentProvider)
    this.transform = entity.component(TransformComponent, true)
  }

  public activate(): void {
    this.scene.main.onBeforeRenderObservable.add(this.update)
    this.options$
      .pipe(
        map((it) => this.content.modelSource(it.url, null, it.rootUrl)),
        filter((it) => !!it),
        switchMap(({ url, rootUrl }) => this.content.streamAsset(url, rootUrl)),
        takeUntil(this.disable$),
      )
      .subscribe((asset) => {
        this.onAssetLoaded(asset)
      })
  }

  public deactivate(): void {
    this.onDataLoaded.cleanLastNotifiedState()
    this.scene.main.onBeforeRenderObservable.removeCallback(this.update)
    this.disable$.next()
    this.instance?.dispose()
    this.instance = null
  }

  public destroy(): void {
    //
  }

  public setOptions(options: SkinnedMeshComponentOptions): void {
    this.options$.next(options)
  }

  private onAssetLoaded(asset: GltfAsset): void {
    this.instance?.dispose()
    this.instance = null
    this.animationList = null

    if (asset) {
      const instance = asset.container.instantiateModelsToScene((name) => name, false, {
        doNotInstantiate: false,
      })
      const animationList = asset.document.json['extras']?.['animationList'] || []
      for (const node of instance.rootNodes) {
        if (this.transform) {
          node.parent = this.transform.node
        }
        this.meshes = getMeshes(node, this.meshes)
      }
      this.instance = instance
      this.animationList = animationList
    }

    this.refreshBoundingInfo()
    this.onDataLoaded.notifyObservers({
      model: this.instance,
      adb: this.animationList,
    })
  }

  public refreshBoundingInfo() {
    if (!this.meshes?.length) {
      return
    }
    for (const mesh of this.meshes) {
      mesh.refreshBoundingInfo(true, true)
    }
  }

  public computeMaxExtents() {
    return computeMaxExtents(this.meshes)
  }

  private update = () => {
    this.refreshBoundingInfo()
  }
}

function getMeshes(node: Node, list: Mesh[]): Mesh[] {
  if (node instanceof Mesh) {
    list.push(node)
  }
  if (node instanceof TransformNode) {
    for (const child of node.getChildren()) {
      getMeshes(child, list)
    }
  }
  return list
}
