import { Directive, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toSignal } from '@angular/core/rxjs-interop'
import { debounceTime, switchMap } from 'rxjs'
import { GameViewerService } from './game-viewer.service'

export type CameraType = 'free' | 'orbit'

@Directive({
  selector: 'nwb-game-viewer-camera',
  exportAs: 'camera',
})
export class GameViewerCameraComponent {
  public mode = input<CameraType>(null)
  public positionInput = input<number[]>(null, {
    alias: 'position',
  })

  private service = inject(GameViewerService)
  private bridge = this.service.bridge

  public connected = toSignal(this.service.bridge$.pipe(switchMap((it) => it.cameraConnected)))
  private position$ = this.service.bridge$.pipe(
    switchMap((it) => it.cameraPosition),
    debounceTime(100),
  )
  public position = toSignal(this.position$, {
    equal: () => false, // same object is emited on every frame
  })
  public positionChange = outputFromObservable(this.position$)

  public constructor() {
    effect(() => {
      const connected = this.connected()
      const bridge = this.bridge()
      const mode = this.mode()
      if (!connected || !mode) {
        return
      }
      untracked(() => {
        bridge.setCameraMode(mode)
      })
    })

    effect(() => {
      const connected = this.connected()
      const bridge = this.bridge()
      const position = this.positionInput()
      if (!connected || !position) {
        return
      }
      untracked(() => {
        bridge.setCameraPosition(position[0], position[1], position[2])
      })
    })
  }
}
