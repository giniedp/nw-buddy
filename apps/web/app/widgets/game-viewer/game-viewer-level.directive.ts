import { Directive, effect, inject, input, resource, untracked } from '@angular/core'
import { loadLevelData } from '@nw-viewer/level/loader'
import { LevelProvider } from '@nw-viewer/services/level-provider'
import { environment } from 'apps/web/environments'
import { GameSystemService } from './game-viewer.service'

@Directive({
  selector: '[nwbGameLevel]',
})
export class GameViewerLevelDirective {
  public level = input<string>(null, { alias: 'nwbGameLevel' })
  public test = input<boolean>(null, { alias: 'nwbGameLevelTest' })
  public levelData = resource({
    request: () => this.level(),
    loader: async ({ request }) => {
      return loadLevelData({
        fetch: fetch.bind(window),
        rootUrl: environment.nwbtUrl,
        levelName: request,
      })
    },
  })

  private service = inject(GameSystemService)

  public constructor() {
    effect(() => {
      const game = this.service.game()
      const data = this.levelData.value()
      const test = this.test()
      untracked(() => {
        if (test) {
          game.system(LevelProvider).loadTestLevel()
        } else {
          game.system(LevelProvider).loadLevel(data)
        }
      })
    })
  }
}
