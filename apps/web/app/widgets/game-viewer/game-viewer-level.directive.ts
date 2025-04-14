import { computed, Directive, effect, inject, input, resource, untracked } from '@angular/core'
import { loadLevelData } from '@nw-viewer/level/loader'
import { LevelProvider } from '@nw-viewer/services/level-provider'
import { environment } from 'apps/web/environments'
import { GameSystemService } from './game-viewer.service'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { filter, startWith, switchMap } from 'rxjs'
import { fromBObservable } from '@nw-viewer/utils'

@Directive({
  selector: '[nwbGameLevel]',
  exportAs: 'level',
})
export class GameViewerLevelDirective {
  private service = inject(GameSystemService)
  private game = this.service.game
  private levelProvider = computed(() => this.game()?.system(LevelProvider))
  private levelProvider$ = toObservable(this.levelProvider)

  public nwbGameLevel = input<string>(null, { alias: 'nwbGameLevel' })
  public nwbGameLevelTest = input<boolean>(null, { alias: 'nwbGameLevelTest' })
  public nwbGameLevelTerrain = input<boolean>(null, { alias: 'nwbGameLevelTerrain' })

  public levelData = resource({
    request: () => this.nwbGameLevel(),
    loader: async ({ request }) => {
      return loadLevelData({
        fetch: fetch.bind(window),
        rootUrl: environment.nwbtUrl,
        levelName: request,
      })
    },
  })

  public terrainEnabled = toSignal(
    this.levelProvider$.pipe(
      filter((it) => !!it),
      switchMap((it) => fromBObservable(it.terrainEnabledObserver).pipe(startWith(it.terrainEnabled))),
    ),
  )

  public constructor() {
    effect(() => {
      const level = this.levelProvider()
      const data = this.levelData.value()
      const test = this.nwbGameLevelTest()
      untracked(() => {
        if (test) {
          level.loadTestLevel()
        } else {
          level.loadLevel(data)
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
