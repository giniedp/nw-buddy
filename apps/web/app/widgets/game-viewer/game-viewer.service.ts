import { inject, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalState } from '@ngrx/signals'
import { NwData } from '@nw-data/db'
import { AdbAction } from '@nw-viewer/babylon/adb'
import { AdbPlayer } from '@nw-viewer/babylon/adb/player'
import { createBabylonViewer } from '@nw-viewer/babylon/services/babylon-viewer'
import { ViewerBridge } from '@nw-viewer/common'
import { GameEntity, GameService, GameServiceContainer, GameServiceType } from '@nw-viewer/ecs'
import { createThreeViewer } from '@nw-viewer/three/services/three-viewer'
import { environment } from 'apps/web/environments'
import { filter, map } from 'rxjs'
import { injectNwData } from '../../data'
import { TranslateService } from '../../i18n'
import { shareReplayRefCount } from '../../utils'

@Injectable()
export class GameViewerService {
  private state = signalState({
    host: null as HTMLElement,
    canvas: null as HTMLCanvasElement,
    game: null as GameServiceContainer,
    bridge: null as ViewerBridge,
  })

  public readonly nwData = injectNwData()
  public readonly tl8 = inject(TranslateService)
  public readonly isLoading = signal(false)
  public readonly isEmpty = signal(false)
  public readonly hasError = signal(false)
  public readonly host = this.state.host
  public readonly game = this.state.game
  public readonly game$ = toObservable(this.game).pipe(
    filter((it) => !!it),
    shareReplayRefCount(1),
  )
  public readonly bridge = this.state.bridge
  public readonly bridge$ = toObservable(this.bridge).pipe(
    filter((it) => !!it),
    shareReplayRefCount(1),
  )

  public readonly loadedEntity = signal<GameEntity>(null)
  public readonly adbPlayer = signal<AdbPlayer>(null)
  public readonly adbActions = signal<AdbAction[]>(null)
  public readonly adbTags = signal<string[]>(null)
  public readonly showTagBrowser = signal(false)

  public create(host: HTMLElement, canvas: HTMLCanvasElement, threeJs: boolean) {
    if (this.host()) {
      throw new Error('GameViewerService already created')
    }

    const game = createGame(canvas, threeJs, this.nwData, this.tl8)
    const bridge = game.get(ViewerBridge, { optional: true })
    patchState(this.state, {
      host,
      canvas,
      game,
      bridge,
    })
  }

  public service<T extends GameService>(type: GameServiceType<T>) {
    return this.game$.pipe(map((game) => game.get(type)))
  }
}

function createGame(canvas: HTMLCanvasElement, threeJs: boolean, nwData?: NwData, tl8?: TranslateService) {
  if (threeJs) {
    return createThreeViewer({
      canvas,
      resizeElement: canvas.parentElement,
      rootUrl: environment.modelsUrl,
      nwbtUrl: environment.nwbtUrl,
      nwData: nwData,
      tl8: tl8,
    })
  }
  return createBabylonViewer({
    canvas,
    resizeElement: canvas.parentElement,
    rootUrl: environment.modelsUrl,
    nwbtUrl: environment.nwbtUrl,
  })
}
