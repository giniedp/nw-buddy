import { Damagetable } from '@nw-data/types'
import { groupBy, mapValues, uniq } from 'lodash'
import { combineLatest, map, Observable } from 'rxjs'
import type { NwDbService } from './nw-db.service'

export function queryDamageTypeToWeaponType(source: Observable<Damagetable[]>): Observable<Record<string, string[]>> {
  return source.pipe(
    map((damagetable) => {
      const data = damagetable
        .filter(
          (it) =>
            it.DamageID.includes('Primary') ||
            it.DamageID === '1H_Sword_Attack1' ||
            it.DamageID === 'MusketAttack1' ||
            it.DamageID === 'BowAttack1'
        )
        .filter((it) => it.AttackType === 'Light' || it.AttackType === 'Heavy')
        .map((it) => {
          return {
            Weapon: it.DamageID.replace(/_Primary.*$/i, '')
              .replace(/_Damage.*$/i, '')
              .replace(/_?Attack.*$/i, '')
              .replace(/^\dH_/i, ''),
            Damage: it.DamageType,
          }
        })
      return mapValues(
        groupBy(data, (it) => it.Damage),
        (it) => uniq(it.map((i) => i.Weapon))
      )
    })
  )
}

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
