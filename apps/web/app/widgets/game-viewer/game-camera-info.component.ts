import { CommonModule } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { SceneProvider } from '@nw-viewer/services/scene-provider'
import { fromBObservable } from '@nw-viewer/utils'
import { map, switchMap } from 'rxjs'
import { GameSystemService } from './game-viewer.service'

@Component({
  selector: 'nwb-game-camera-info',
  template: ` {{ cameraPosition() }} `,
  imports: [CommonModule],
})
export class GameCameraInfoComponent {
  private service = inject(GameSystemService)
  private game = this.service.game
  private scene = computed(() => this.game()?.system(SceneProvider))
  private cameraPosition$ = toObservable(this.scene).pipe(
    switchMap((it) => fromBObservable(it.main.onActiveCameraChanged)),
    switchMap((it) => fromBObservable(it.activeCamera.onViewMatrixChangedObservable)),
    map((it) => {
      return [it.position.x.toFixed(2), it.position.y.toFixed(2), it.position.z.toFixed(2)].join(' ')
    }),
  )
  protected cameraPosition = toSignal(this.cameraPosition$)
}
