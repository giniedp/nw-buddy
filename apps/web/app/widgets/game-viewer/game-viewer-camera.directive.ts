import { computed, Directive, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ArcRotateCamera } from '@babylonjs/core'
import { SceneProvider } from '@nw-viewer/services/scene-provider'
import { fromBObservable } from '@nw-viewer/utils'
import { debounceTime, map, startWith, switchMap } from 'rxjs'
import { GameViewerService } from './game-viewer.service'

export type CameraType = 'free' | 'fly' | 'arc'

@Directive({
  selector: '[nwbGameCamera]',
  exportAs: 'camera',
})
export class GameViewerCameraDirective {
  public nwbGameCamera = input<CameraType>(null)
  public nwbGameCameraPosition = input<number[]>(null)

  private service = inject(GameViewerService)
  private game = this.service.game
  private scene = computed(() => this.game()?.get(SceneProvider))
  private position$ = toObservable(this.scene).pipe(
    switchMap((scene) => fromBObservable(scene.main.onActiveCameraChanged)),
    switchMap((scene) => {
      return fromBObservable(scene.activeCamera.onViewMatrixChangedObservable).pipe(startWith(scene.activeCamera))
    }),
    map((it) => it?.position),
  )

  public position = toSignal(this.position$, {
    // false, because the same vector is returned when the camera is moved
    equal: () => false,
  })
  public nwbGameCameraPositionChange = outputFromObservable(this.position$.pipe(debounceTime(100)))

  public constructor() {
    effect(() => {
      const scene = this.service.game().get(SceneProvider)
      const type = this.nwbGameCamera()
      const position = this.nwbGameCameraPosition()
      untracked(() => {
        this.updateCamera(scene, type, position)
      })
    })
  }

  private updateCamera(scene: SceneProvider, type: CameraType, position: number[]) {
    switch (type) {
      case 'free': {
        if (scene.main.activeCamera !== scene.freeCamera) {
          scene.main.activeCamera = scene.freeCamera
        }
        break
      }
      case 'arc': {
        if (scene.main.activeCamera !== scene.arcRotateCamera) {
          scene.main.activeCamera = scene.arcRotateCamera
        }
        break
      }
      case 'fly': {
        if (scene.main.activeCamera !== scene.flyCamera) {
          scene.main.activeCamera = scene.flyCamera
        }
        break
      }
    }
    const camera = scene.main.activeCamera
    if (position) {
      if (camera instanceof ArcRotateCamera) {
        const dir = camera.cameraDirection
        const radius = camera.radius
        camera.target.copyFromFloats(
          position[0] + dir.x * radius,
          position[1] + dir.y * radius,
          position[2] + dir.z * radius,
        )
      }
      camera.position.copyFromFloats(position[0], position[1], position[2])
    }
  }
}
