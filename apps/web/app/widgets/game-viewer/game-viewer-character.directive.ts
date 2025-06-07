import { computed, Directive, effect, inject, input, resource, signal, untracked } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { NwData } from '@nw-data/db'
import { ActionlistComponent } from '@nw-viewer/babylon/components/actionlist-component'
import { SkinnedMeshComponent } from '@nw-viewer/babylon/components/skinned-mesh-component'
import { SceneProvider } from '@nw-viewer/babylon/services/scene-provider'
import { fromBObservable, reduceMeshesExtendsToBoundingInfo, reframeCamera } from '@nw-viewer/babylon/utils'
import { GameEntity, GameServiceContainer } from '@nw-viewer/ecs'
import { injectNwData } from '~/data'
import { vitalModelUriById } from '../model-viewer/utils/get-model-uri'
import { getModelUrl } from '../model-viewer/utils/get-model-url'
import { GameViewerService } from './game-viewer.service'

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
  private service = inject(GameViewerService)

  public npcId = input<string>(undefined, { alias: 'nwGameViewerNpc' })
  public vitalId = input<string>(undefined, { alias: 'nwGameViewerVital' })
  public options = input<CharacterViewerEntityOptions>(null, { alias: 'nwGameViewerCharacter' })

  private activeOptions = computed(() => {
    if (this.vitalId()) {
      return this.vitalOptionsList.value()?.[0]
    }
    if (this.npcId()) {
      // TODO: implement options by npcId
    }
    return this.options()
  })

  protected entity = signal<GameEntity>(null)

  protected modelComponent = computed(() => this.entity()?.component(SkinnedMeshComponent))
  protected modelResource = rxResource({
    params: this.modelComponent,
    stream: ({ params }) => fromBObservable(params?.onDataLoaded),
  })
  protected modelData = this.modelResource.value

  protected actionComponent = computed(() => this.entity()?.component(ActionlistComponent))
  protected actionData = rxResource({
    params: this.actionComponent,
    stream: ({ params }) => fromBObservable(params?.onDataLoaded),
  }).value

  private vitalOptionsList = resource({
    params: this.vitalId,
    loader: async ({ params }) => loadVitalsOptions(params, this.db),
  })

  public constructor() {
    effect((onCleanup) => {
      const game = this.service.game()
      const options = this.activeOptions()
      if (!game || !options) {
        return null
      }
      const entity = createEntity(game, options)
      onCleanup(() => {
        this.service.loadedEntity.set(null)
        entity.destroy()
      })
      this.entity.set(entity)
      this.service.loadedEntity.set(entity)
    })

    // propagate the actionlist to the service
    effect(() => {
      const actionlist = this.actionComponent()
      const data = this.actionData()
      untracked(() => {
        this.service.adbPlayer.set(actionlist?.player)
        this.service.adbActions.set(data?.actions || [])
        this.service.adbTags.set(data?.tags || [])
      })
    })

    // reframe camera when model has changed
    effect(() => {
      const loading = this.modelResource.isLoading()
      const model = this.modelResource.value()?.model
      if (loading) {
        return
      }
      untracked(() => {
        this.service.isLoading.set(false)
        this.service.isEmpty.set(!model)
        if (model) {
          this.reframeCamera()
        }
      })
    })

    effect(() => {
      const loading = this.vitalOptionsList.isLoading()
      const value = this.vitalOptionsList.value()
      untracked(() => {
        if (loading) {
          this.service.isLoading.set(loading)
          this.service.isEmpty.set(false)
        }
        if (!loading && !value?.length) {
          this.service.isLoading.set(false)
          this.service.isEmpty.set(true)
        }
      })
    })
  }

  public reframeCamera() {
    if (!this.modelComponent()?.instance) {
      return
    }
    const extents = this.modelComponent().computeMaxExtents()
    const bounding = reduceMeshesExtendsToBoundingInfo(extents)
    const camera = this.service.game().get(SceneProvider).arcRotateCamera
    reframeCamera(camera, bounding)
  }
}

function createEntity(game: GameServiceContainer, options: CharacterViewerEntityOptions) {
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

async function loadVitalsOptions(vitalsId: string, db: NwData) {
  if (vitalsId === undefined) {
    return undefined
  }
  const meta = await db.vitalsMetadataById(vitalsId)
  if (!meta) {
    return []
  }
  const models = await Promise.all(meta.models.map((id) => db.vitalsModelsMetadataById(id)))
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
}
