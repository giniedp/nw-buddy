import { computed, Directive, effect, inject, input, untracked } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { LevelProvider } from '@nw-viewer/services/level-provider'
import { fromBObservable } from '@nw-viewer/utils'
import { filter, startWith, switchMap } from 'rxjs'
import { GameViewerService } from './game-viewer.service'

@Directive({
  selector: '[nwbGameLevel]',
  exportAs: 'level',
})
export class GameViewerLevelDirective {
  private service = inject(GameViewerService)
  private game = this.service.game
  private levelProvider = computed(() => this.game()?.get(LevelProvider))
  private levelProvider$ = toObservable(this.levelProvider)

  public nwbGameLevel = input<string>(null, { alias: 'nwbGameLevel' })
  public nwbGameLevelTest = input<boolean>(null, { alias: 'nwbGameLevelTest' })
  public nwbGameLevelTerrain = input<boolean>(null, { alias: 'nwbGameLevelTerrain' })

  public terrainEnabled = toSignal(
    this.levelProvider$.pipe(
      filter((it) => !!it),
      switchMap((it) => fromBObservable(it.terrainEnabledObserver).pipe(startWith(it.terrainEnabled))),
    ),
  )

  public constructor() {
    effect(() => {
      const level = this.levelProvider()
      const name = this.nwbGameLevel()
      const test = this.nwbGameLevelTest()
      untracked(() => {
        if (test) {
          level.loadTestLevel()
        } else {
          level.loadLevel(name)
        }
      })
    })
    effect(() => {
      const level = this.levelProvider()
      const terrainEnbalbed = this.nwbGameLevelTerrain()
      untracked(() => {
        if (level) {
          level.setTerrainEnabled(terrainEnbalbed)
        }
      })
    })
  }

  public setTerrainEnabled(value: boolean) {
    const level = this.levelProvider()
    if (level) {
      level.setTerrainEnabled(value)
    }
  }
}
