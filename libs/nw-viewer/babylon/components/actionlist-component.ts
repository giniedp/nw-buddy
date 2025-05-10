import { Observable } from '@babylonjs/core'
import { catchError, map, of, Subject, switchMap, takeUntil } from 'rxjs'
import { GameComponent, GameEntity } from '../../ecs'
import { AdbAction, AdbFragment, loadAdbActions } from '../adb'
import { AdbPlayer } from '../adb/player'
import { ContentProvider } from '../services/content-provider'
import { SceneProvider } from '../services/scene-provider'
import { fromBObservable } from '../utils'
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
  private actions: AdbAction[] = []

  public entity: GameEntity

  public readonly player = new AdbPlayer()
  public readonly defaultTags: string[]
  public readonly animationDatabase: string
  public readonly onDataLoaded = new Observable<{ tags: string[]; actions: AdbAction[] }>()

  public constructor(options: ActionlistComponentOptions) {
    this.defaultTags = options.defaultTags || []
    this.animationDatabase = options.animationDatabase
    this.onDataLoaded.notifyIfTriggered = true
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.model = this.entity.component(SkinnedMeshComponent)
    this.content = this.entity.service(ContentProvider)
    this.scene = this.entity.service(SceneProvider)
  }

  public activate(): void {
    this.scene.main.onBeforeRenderObservable.add(this.update)
    fromBObservable(this.model.onDataLoaded)
      .pipe(
        map((it) => it.adb),
        switchMap((list) => {
          if (!list?.length || !this.animationDatabase) {
            return of<AdbAction[]>([])
          }
          return loadAdbActions({
            url: this.animationDatabase,
            rootUrl: this.content.rootUrl,
            files: list,
          })
        }),
        catchError((error) => {
          console.error('Error loading action list', error)
          return of<AdbAction[]>([])
        }),
        takeUntil(this.deactivate$),
      )
      .subscribe((actions) => {
        this.actions = actions || []
        this.player.reset(this.entity.game, this.model.instance.rootNodes)
        this.onDataLoaded.notifyObservers({ tags: this.defaultTags, actions: this.actions })
        this.playIdleAnimation()
      })
  }

  public deactivate(): void {
    this.onDataLoaded.cleanLastNotifiedState()
    this.scene.main.onBeforeRenderObservable.removeCallback(this.update)
    this.deactivate$.next()
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

  private update = () => {
    this.player.update()
  }
}
