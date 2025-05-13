import { Directive, effect, inject, input, signal, untracked } from '@angular/core'
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

  public terrainEnabled = signal(false)
  // public terrainEnabled = toSignal(
  //   this.levelProvider$.pipe(
  //     filter((it) => !!it),
  //     switchMap((it) => fromBObservable(it.terrainEnabledObserver).pipe(startWith(it.terrainEnabled))),
  //   ),
  // )

  public constructor() {
    effect(() => {
      const accessor = this.bridge()
      const level = this.nwbGameLevel()
      const map = this.nwbGameMap()
      untracked(() => accessor?.loadLevel(level, map))
    })
    effect(() => {
      // const level = this.levelProvider()
      // const terrainEnbalbed = this.nwbGameLevelTerrain()
      // untracked(() => {
      //   if (level) {
      //     level.setTerrainEnabled(terrainEnbalbed)
      //   }
      // })
    })
  }

  public setTerrainEnabled(value: boolean) {
    // const level = this.levelProvider()
    // if (level) {
    //   level.setTerrainEnabled(value)
    // }
  }
}
