import { Directive, effect, inject, input, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { of, switchMap } from 'rxjs'
import { GameViewerService } from './game-viewer.service'

@Directive({
  selector: '[nwbGameLevel]',
  exportAs: 'level',
})
export class GameViewerLevelDirective {
  private service = inject(GameViewerService)
  private bridge = this.service.bridge

  public isConnected = toSignal(this.service.bridge$.pipe(switchMap((it) => it.levelConnected || of(false))))

  public nwbGameLevel = input<string>(null, { alias: 'nwbGameLevel' })
  public nwbGameMap = input<string>(null, { alias: 'nwbGameMap' })
  public nwbGameLevelTerrain = input<boolean>(null, { alias: 'nwbGameLevelTerrain' })

  public terrainEnabled = toSignal(this.service.bridge$.pipe(switchMap((it) => it.terrainEnabled || of(false))))

  public constructor() {
    effect(() => {
      const bridge = this.bridge()
      const level = this.nwbGameLevel()
      const map = this.nwbGameMap()
      untracked(() => bridge?.loadLevel(level, map))
    })
    effect(() => {
      const bridge = this.bridge()
      const enabled = this.nwbGameLevelTerrain()
      untracked(() => {
        bridge?.setTerrainEnabled(enabled)
      })
    })
  }
}
