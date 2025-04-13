import { BehaviorSubject, catchError, of, Subject, switchMap, takeUntil } from 'rxjs'
import { AdbAction, AdbFragment, loadAdbActions } from '../adb'
import { AdbPlayer } from '../adb/player'
import { GameComponent, GameEntity } from '../ecs'
import { ContentProvider } from '../services/content-provider'
import { SkinnedMeshComponent } from './skinned-mesh-component'

export interface ActionlistComponentOptions {
  defaultTags: string[]
  // controllerDefinition: string
  animationDatabase: string
  // damagetable: string
  // cdfPath: string
}

export class ActionlistComponent implements GameComponent {
  #disable$ = new Subject<void>()
  #actions$ = new BehaviorSubject<AdbAction[]>(null)
  private player = new AdbPlayer()
  private modelComponent: SkinnedMeshComponent
  private contentComponent: ContentProvider

  public entity: GameEntity
  public actions$ = this.#actions$.asObservable()
  public playerState$ = this.player.playbackState$
  public fragment$ = this.player.fragment$

  public constructor(private options: ActionlistComponentOptions) {
    //
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.modelComponent = this.entity.component(SkinnedMeshComponent)
    this.contentComponent = this.entity.system(ContentProvider)
  }

  public activate(): void {
    this.modelComponent.animationList$
      .pipe(
        switchMap((list) => {
          if (!list?.length || !this.options.animationDatabase) {
            return of([])
          }
          return loadAdbActions({
            url: this.options.animationDatabase,
            rootUrl: this.contentComponent.rootUrl,
            files: list,
          })
        }),
        catchError((error) => {
          console.error('Error loading action list', error)
          return of(null)
        }),
        takeUntil(this.#disable$),
      )
      .subscribe(this.#actions$)

    this.modelComponent.instance$.pipe(takeUntil(this.#disable$)).subscribe((model) => {
      this.player.reset(this.entity.game, model)
    })
  }

  public deactivate(): void {
    this.#disable$.next()
  }

  public destroy(): void {
    this.player.dispose()
  }

  public playFragment(fragment: AdbFragment) {
    this.player.executeFragment(fragment)
  }
}
