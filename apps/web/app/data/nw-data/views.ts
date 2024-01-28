import { combineLatest, map } from 'rxjs'
import type { NwDataService } from './nw-data.service'

export function queryGemPerksWithAffix(db: NwDataService) {
  return combineLatest({
    perks: db.perks,
    affixstats: db.affixStats,
  }).pipe(
    map(({ perks, affixstats }) => {
      return perks
        .filter((it) => it.PerkType === 'Gem')
        .map((perk) => {
          return {
            perk,
            stat: affixstats.find((it) => it.StatusID === perk.Affix),
          }
        })
        .filter((it) => !!it.stat)
    })
  )
}

export function queryMutatorDifficultiesWithRewards(db: NwDataService) {
  return combineLatest({
    events: db.gameEventsMap,
    difficulties: db.mutatorDifficulties,
  })
  .pipe(map(({ events, difficulties }) => {
    return difficulties.map((difficulty) => {
      return {
        difficulty,
        rewards: [
          events.get(difficulty.CompletionEvent1),
          events.get(difficulty.CompletionEvent2),
          events.get(difficulty.CompletionEvent3)
        ]
      }
    })
  }))
}
