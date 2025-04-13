import { Directive, effect, inject, input, linkedSignal, resource, signal, untracked } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { combineLatest, map, of, switchMap, tap } from 'rxjs'
import { injectNwData } from '~/data'
import { shareReplayRefCount } from '~/utils'
import { vitalModelUriById } from '../model-viewer/utils/get-model-uri'
import { getModelUrl } from '../model-viewer/utils/get-model-url'
import { ActionlistComponent } from '@nw-viewer/components/actionlist-component'
import { SkinnedMeshComponent } from '@nw-viewer/components/skinned-mesh-component'
import { GameEntity, GameHost } from '@nw-viewer/ecs'
import { GameSystemService } from './game-viewer.service'

export type GameViewerCharacterOptions = { vitalId: string } | { npcId: string } | CharacterViewerEntityOptions
export interface CharacterViewerEntityOptions {
  rootUrl: string
  url: string
  adbUrl: string
  tags: string[]
}

@Directive({
  selector: '[nwGameViewerCharacter],[nwGameViewerVital],[nwGameViewerNpc]',
  exportAs: 'character',
})
export class GameViewerCharacterDirective {
  private db = injectNwData()
  private service = inject(GameSystemService)
  private entity = signal<GameEntity>(null)

  public npcId = input<string>(undefined, { alias: 'nwGameViewerNpc' })
  public vitalId = input<string>(undefined, { alias: 'nwGameViewerVital' })
  public options = input<CharacterViewerEntityOptions>(null, { alias: 'nwGameViewerCharacter' })
  public autofocus = input<boolean>(true)

  private selectedOptions = linkedSignal(this.options)

  protected character$ = combineLatest({
    game: toObservable(this.service.game),
    options: toObservable(this.selectedOptions),
  }).pipe(
    tap({ next: () => this.disposeEntity() }),
    map(({ game, options }) => createEntity(game, options)),
    shareReplayRefCount(1),
  )
  protected actionlist$ = this.character$.pipe(map((entity) => entity?.component(ActionlistComponent)))
  protected actionlist = toSignal(this.actionlist$)
  protected actions = toSignal(this.actionlist$.pipe(switchMap((list) => (list ? list.actions$ : of([])))))
  protected state = toSignal(this.actionlist$.pipe(switchMap((list) => (list ? list.playerState$ : of(null)))))

  private vitalOptionsList = resource({
    request: this.vitalId,
    loader: async ({ request }) => {
      if (request === undefined) {
        return undefined
      }
      const meta = await this.db.vitalsMetadataById(request)
      if (!meta) {
        return []
      }
      const models = await Promise.all(meta.models.map((id) => this.db.vitalsModelsMetadataById(id)))
      return models
        .filter((it) => !!it)
        .map((model) => {
          const uri = vitalModelUriById(model.id)
          const { rootUrl, modelUrl } = getModelUrl(uri)
          return {
            rootUrl,
            url: modelUrl,
            adbUrl: model.adb,
            tags: model.tags,
          }
        })
    },
  })

  public constructor() {
    effect(() => {
      const options = this.vitalOptionsList.value()?.[0]
      untracked(() => {
        this.selectedOptions.set(options)
      })
    })

    this.character$.pipe(takeUntilDestroyed()).subscribe((entity) => {
      this.entity.set(entity)
    })

    // propagate the actionlist to the service
    effect(() => {
      const actions = this.actions()
      untracked(() => this.service.adbActions.set(actions || []))
    })

    // propagate the player state to the service
    effect(() => {
      const state = this.state()
      untracked(() => this.service.adbPlayerState.set(state || null))
    })

    //
    effect(() => {
      const fragment = this.service.adbFragment()
      const actionlist = this.actionlist()
      untracked(() => actionlist?.playFragment(fragment))
    })
  }

  private disposeEntity() {
    const entity = this.entity()
    if (entity) {
      entity.destroy()
      this.entity.set(null)
    }
  }
}

function createEntity(game: GameHost, options: CharacterViewerEntityOptions) {
  if (!options || !game) {
    return null
  }
  return game
    .createEntity()
    .addComponents(
      new SkinnedMeshComponent({
        url: options.url,
        rootUrl: options.rootUrl,
      }),
      new ActionlistComponent({
        animationDatabase: options.adbUrl,
        defaultTags: options.tags,
      }),
    )
    .initialize(game)
    .activate()
}
