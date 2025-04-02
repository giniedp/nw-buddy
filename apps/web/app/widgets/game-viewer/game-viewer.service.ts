import { computed, ElementRef, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { NEVER, of, switchMap } from 'rxjs'
import { selectSignal } from '~/utils'
import { NwViewer } from './nw-viewer'
import { NwViewerCharacter } from './nw-character'
import { computeAssetBoundingInfo, reframeCamera } from './utils'
import { Vector3 } from '@babylonjs/core'

@Injectable()
export class GameViewerService {
  public readonly host = signal<ElementRef<HTMLElement> | null>(null)
  public readonly viewer = signal<NwViewer | null>(null)
  public readonly viewer$ = toObservable(this.viewer).pipe(switchMap((viewer) => (viewer ? of(viewer) : NEVER)))

  public readonly character = signal<NwViewerCharacter | null>(null)

  public readonly scene = computed(() => this.viewer()?.scene)

  public setViewer(viewer: NwViewer, host: ElementRef<HTMLElement>) {
    this.viewer.set(viewer)
    this.host.set(host)
  }

  public setCharacter(character: NwViewerCharacter) {
    this.character.set(character)
  }

  public focusCharacter() {
    const character = this.character()
    const viewer = this.viewer()
    if (!character || !character) {
      return
    }
    const bounds = computeAssetBoundingInfo(character.asset)
    reframeCamera(viewer.camera, bounds, true)
  }
}
