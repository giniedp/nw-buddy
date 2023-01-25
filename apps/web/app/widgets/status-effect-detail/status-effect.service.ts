import { Injectable } from '@angular/core'
import { Perks, Statuseffect } from '@nw-data/types'
import { flatten, uniq } from 'lodash'
import { combineLatest, map, of, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { humanize, mapList, rejectKeys, shareReplayRefCount } from '~/utils'

@Injectable()
export class StatusEffectDetailService {
  public readonly effectId$ = new ReplaySubject<string>(1)
  public readonly effect$ = this.db.statusEffect(this.effectId$).pipe(shareReplayRefCount(1))
  public readonly icon$ = this.effect$.pipe(map((it) => it?.PlaceholderIcon || NW_FALLBACK_ICON))
  public readonly name$ = this.effect$.pipe(map((it) => it?.DisplayName))
  public readonly nameForDisplay$ = this.effect$.pipe(map((it) => it?.DisplayName || humanize(it?.StatusID)))
  public readonly source$ = this.effect$.pipe(map((it) => it?.['$source']))
  public readonly description$ = this.effect$.pipe(map((it) => it?.Description))
  public readonly properties$ = this.effect$.pipe(map(reduceProps)).pipe(shareReplayRefCount(1))

  public readonly refEffects$ = this.effect$.pipe(
    map((it) => {
      return uniq(
        flatten([
          it?.OnDeathStatusEffect,
          it?.OnEndStatusEffect,
          it?.OnStackStatusEffect,
          it?.OnTickStatusEffect,
          it?.RemoveStatusEffects,
        ])
      )
        .filter((e) => !!e && e !== 'Debuff')
        .filter((e) => e !== it.StatusID)
    })
  )

  public readonly refAbilities$ = this.effect$.pipe(
    map((it) => {
      return uniq(flatten([it?.EquipAbility])).filter((e) => !!e)
    })
  )

  public readonly foreignAbilities$ = combineLatest([
    this.db.abilitiesByStatusEffect(this.effectId$).pipe(map((set) => Array.from(set?.values() || []))),
    this.db.abilitiesBySelfApplyStatusEffect(this.effectId$).pipe(map((set) => Array.from(set?.values() || []))),
  ])
    .pipe(map(flatten))
    .pipe(mapList((it) => it.AbilityID))
    .pipe(map(uniq))

  public readonly foreignAffixStats$ = this.db
    .affixByStatusEffect(this.effectId$)
    .pipe(map((set) => Array.from(set?.values() || [])))
    .pipe(mapList((it) => it.StatusID))
    .pipe(map(uniq))

  public readonly foreignPerks$ = this.foreignAffixStats$
    .pipe(
      switchMap((affix) => {
        if (!affix?.length) {
          return of<Perks[][]>([])
        }
        return combineLatest(
          affix.map((it) => {
            return this.db.perksByAffix(it).pipe(map((set) => Array.from(set?.values() || [])))
          })
        )
      })
    )
    .pipe(map(flatten))
    .pipe(mapList((it) => it.PerkID))
    .pipe(map(uniq))

  public constructor(private db: NwDbService) {
    //
  }

  public load(idOrItem: string | Statuseffect) {
    if (typeof idOrItem === 'string') {
      this.effectId$.next(idOrItem)
    } else {
      this.effectId$.next(idOrItem?.StatusID)
    }
  }
}

function reduceProps(item: Statuseffect) {
  const reject = ['$source', 'PlaceholderIcon']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
