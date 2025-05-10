import { Subject } from 'rxjs'
import { GameComponent, GameEntity } from '../../ecs'
import { AdbAction, AdbFragment, loadAdbActions } from '../adb'
import { AdbPlayer } from '../adb/player'
import { ContentProvider } from '../services/content-provider'
import { RendererProvider } from '../services/renderer-provider'
import { SceneProvider } from '../services/scene-provider'
import { SkinnedMeshComponent } from './skinned-mesh-component'

export interface ActionlistComponentOptions {
  defaultTags: string[]
  // controllerDefinition: string
  animationDatabase: string
  // damagetable: string
  // cdfPath: string
}

export class ActionlistComponent implements GameComponent {
  private deactivate$ = new Subject<void>()

  private model: SkinnedMeshComponent
  private content: ContentProvider
  private scene: SceneProvider
  private renderer: RendererProvider
  private actions: AdbAction[] = []

  public entity: GameEntity

  public readonly player = new AdbPlayer()
  public readonly defaultTags: string[]
  public readonly animationDatabase: string
  // public readonly onDataLoaded = new Observable<{ tags: string[]; actions: AdbAction[] }>()

  public constructor(options: ActionlistComponentOptions) {
    this.defaultTags = options.defaultTags || []
    this.animationDatabase = options.animationDatabase
    // this.onDataLoaded.notifyIfTriggered = true
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.model = this.entity.component(SkinnedMeshComponent)
    this.content = this.entity.service(ContentProvider)
    this.scene = this.entity.service(SceneProvider)
    this.renderer = this.entity.service(RendererProvider)
  }

  public activate(): void {
    this.renderer.onUpdate.add(this.update)
    this.model.onLoad.add(this.onModelLoaded)
    // fromBObservable(this.model.onDataLoaded)
    //   .pipe(
    //     map((it) => it.adb),
    //     switchMap((list) => {
    //       if (!list?.length || !this.animationDatabase) {
    //         return of<AdbAction[]>([])
    //       }
    //       return loadAdbActions({
    //         url: this.animationDatabase,
    //         rootUrl: this.content.rootUrl,
    //         files: list,
    //       })
    //     }),
    //     catchError((error) => {
    //       console.error('Error loading action list', error)
    //       return of<AdbAction[]>([])
    //     }),
    //     takeUntil(this.deactivate$),
    //   )
    //   .subscribe((actions) => {
    //     this.actions = actions || []
    //     this.player.reset(this.entity.game, this.model.instance.rootNodes)
    //     this.onDataLoaded.notifyObservers({ tags: this.defaultTags, actions: this.actions })
    //     this.playIdleAnimation()
    //   })
  }

  public deactivate(): void {
    this.renderer.onUpdate.remove(this.update)
    this.model.onLoad.remove(this.onModelLoaded)
    // this.deactivate$.next()
  }

  public destroy(): void {
    this.player.dispose()
  }

  public playFragment(fragment: AdbFragment) {
    this.player.executeFragment(fragment)
  }

  public playIdleAnimation() {
    const action = this.actions?.find((it) => /idle/gi.test(it.name))
    if (!action) {
      return
    }
    const fragment = action.fragments[action.fragments.length - 1]
    this.player.executeFragment(fragment)
  }

  private onModelLoaded = async () => {
    const list = this.model.animationList
    if (!list?.length || !this.animationDatabase) {
      return
    }
    const actions = await loadAdbActions({
      url: this.animationDatabase,
      rootUrl: this.content.rootUrl,
      files: list,
    })
    this.actions = actions || []
    console.log('Actions loaded', this.actions)
    this.player.reset(this.entity.game, this.model.model)
    // this.onDataLoaded.notifyObservers({ tags: this.defaultTags, actions: this.actions })
    // this.playIdleAnimation()
  }

  private update = () => {
    this.player.update()
  }
}
