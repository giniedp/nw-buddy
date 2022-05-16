import { groupBy } from 'lodash'
import { combineLatest, map, Observable, of } from 'rxjs'
import type { NwDbService } from './nw-db.service'

export function queryGemPerksWithAffix(db: NwDbService) {
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

export function queryMutatorDifficultiesWithRewards(db: NwDbService) {
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
