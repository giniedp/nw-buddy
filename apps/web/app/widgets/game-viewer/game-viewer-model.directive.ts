import { Directive, effect, inject, input, signal } from '@angular/core'
import { StaticMeshComponent } from '@nw-viewer/components/static-mesh-component'
import { GameEntity, GameServiceContainer } from '@nw-viewer/ecs'
import { injectNwData } from '~/data'
import { GameViewerService } from './game-viewer.service'

@Directive({
  selector: '[nwGameViewerModel]',
  exportAs: 'character',
})
export class GameViewerCharacterDirective {
  private db = injectNwData()
  private service = inject(GameViewerService)

  public modelUrl = input<string>(undefined, { alias: 'nwGameViewerModel' })

  protected entity = signal<GameEntity>(null)

  public constructor() {
    effect((onCleanup) => {
      const game = this.service.game()
      const modelUrl = this.modelUrl()
      if (!game) {
        return null
      }
      const entity = createEntity(game, modelUrl)
      onCleanup(() => entity.destroy())
      this.entity.set(entity)
    })
  }

  public reframeCamera() {
    // if (!this.modelComponent()?.instance) {
    //   return
    // }
    // const extents = this.modelComponent().computeMaxExtents()
    // const bounding = reduceMeshesExtendsToBoundingInfo(extents)
    // const camera = this.service.game().get(SceneProvider).arcRotateCamera
    // reframeCamera(camera, bounding)
  }
}

function createEntity(game: GameServiceContainer, url: string) {
  return game
    .createEntity()
    .addComponents(
      new StaticMeshComponent({
        model: url,
        //rootUrl: options.rootUrl,
      }),
    )
    .initialize(game)
    .activate()
}
