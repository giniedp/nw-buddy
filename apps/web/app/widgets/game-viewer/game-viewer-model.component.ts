import { Directive, effect, inject, input, signal } from '@angular/core'
import { GameViewerService } from './game-viewer.service'

@Directive({
  selector: 'nwb-game-viewer-model',
  exportAs: 'model',
})
export class GameViewerModelComponent {
  public readonly service = inject(GameViewerService)
  public readonly bridge = this.service.bridge
  public readonly url = input<string>(null)
  public readonly rootUrl = input<string>(null)
  public readonly isLoading = signal(false)
  public readonly isLoaded = signal(false)

  public constructor() {
    effect((onCleanup) => {
      const bridge = this.bridge()
      const url = this.url()
      const rootUrl = this.rootUrl()
      if (!bridge) {
        return null
      }
      this.isLoading.set(true)
      const entity = bridge.createModelEntity(url, rootUrl, () => {
        this.isLoading.set(false)
        this.isLoaded.set(true)
        bridge.reframeCameraOn(entity)
        this.service.loadedEntity.set(entity)
      })
      onCleanup(() => {
        this.service.loadedEntity.set(null)
        entity?.destroy()
      })
    })
  }
}
