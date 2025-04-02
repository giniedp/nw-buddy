import { Directive, effect, inject, input, linkedSignal, resource } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { Scene } from '@babylonjs/core'
import { combineLatest, Observable, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { shareReplayRefCount } from '~/utils'
import { vitalModelUriById } from '../model-viewer/utils/get-model-uri'
import { getModelUrl } from '../model-viewer/utils/get-model-url'
import { GameViewerService } from './game-viewer.service'
import { NwCharacterOptions, NwViewerCharacter } from './nw-character'

export type GameViewerCharacterOptions = NwCharacterOptions | { vitalId: string } | { npcId: string }

@Directive({
  selector: '[nwGameViewerCharacter],[nwGameViewerVital],[nwGameViewerNpc]',
  exportAs: 'character',
})
export class GameViewerCharacterDirective {
  private db = injectNwData()
  private service = inject(GameViewerService)

  public npcId = input<string>(undefined, { alias: 'nwGameViewerNpc' })
  public vitalId = input<string>(undefined, { alias: 'nwGameViewerVital' })
  public options = input<NwCharacterOptions>(null, { alias: 'nwGameViewerCharacter' })
  public autofocus = input<boolean>(true)

  private selectedOptions = linkedSignal(this.options)

  protected character$ = combineLatest({
    scene: toObservable(this.service.scene),
    options: toObservable(this.selectedOptions),
  }).pipe(switchMap(({ scene, options }) => loadCharacter(scene, options)))

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
        .map((model): NwCharacterOptions => {
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
    this.character$.pipe(takeUntilDestroyed()).subscribe((character) => {
      if (character) {
        character.enable()
        character.executeActionByName('Idle', true)
      }
      this.service.setCharacter(character)
      if (this.autofocus()) {
        this.service.focusCharacter()
      }
    })
    effect(() => {
      const list = this.vitalOptionsList.value()
      if (!list) {
        return
      }
      this.selectedOptions.set(list[0])
    })
  }
}

function loadCharacter(scene: Scene, options: NwCharacterOptions) {
  if (!scene || !options) {
    return of(null)
  }
  return new Observable<NwViewerCharacter>((subscriber) => {
    const character = new NwViewerCharacter(scene, options)
    character.loaded
      .then(() => subscriber.next(character))
      .catch((err) => {
        subscriber.error(err)
        subscriber.next(null)
      })
    return () => disposeCharacter(character)
  }).pipe(shareReplayRefCount(1))
}

async function disposeCharacter(character: NwViewerCharacter) {
  if (!character) {
    return
  }
  await character.loaded
  await character.disable()
  character.dispose()
}
