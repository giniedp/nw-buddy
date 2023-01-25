import { Injectable, Output } from '@angular/core'
import { Affixstats, Perks } from '@nw-data/types'
import { map, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { mapProp, rejectKeys, shareReplayRefCount } from '~/utils'

@Injectable()
export class PerkDetailService {
  public readonly perkId$ = new ReplaySubject<string>(1)

  @Output()
  public readonly perk$ = this.db.perk(this.perkId$).pipe(shareReplayRefCount(1))

  public readonly icon$ = this.perk$.pipe(map((it) => it?.IconPath || NW_FALLBACK_ICON))
  public readonly name$ = this.perk$.pipe(mapProp('DisplayName'))
  public readonly type$ = this.perk$.pipe(mapProp('PerkType'))
  public readonly description$ = this.perk$.pipe(mapProp('Description'))
  public readonly properties$ = this.perk$.pipe(map(reduceProps)).pipe(shareReplayRefCount(1))

  public readonly affix$ = this.perk$.pipe(switchMap((it) => this.db.affixstat(it?.Affix))).pipe(shareReplayRefCount(1))
  public readonly affixProps$ = this.affix$.pipe(map(reduceAffixProps))

  public readonly refAbilities$ = this.perk$.pipe(map((it) => (it?.EquipAbility?.length ? it?.EquipAbility : null)))
  public readonly refEffects$ = this.affix$.pipe(map((it) => (it?.StatusEffect ? [it.StatusEffect] : null)))

  public constructor(private db: NwDbService) {
    //
  }

  public load(idOrItem: string | Perks) {
    if (typeof idOrItem === 'string') {
      this.perkId$.next(idOrItem)
    } else {
      this.perkId$.next(idOrItem?.PerkID)
    }
  }
}

function reduceProps(item: Perks) {
  const reject = ['$source', 'IconPath', 'DisplayName', 'Description']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function reduceAffixProps(item: Affixstats) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
