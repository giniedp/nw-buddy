import { Injectable, Output } from '@angular/core'
import { Affixstats, Perks } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { stripAbilityProperties, stripAffixProperties } from '~/nw/utils'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class PerkDetailService {
  public readonly perkId$ = new ReplaySubject<string>(1)
  @Output()
  public readonly perk$ = this.db.perk(this.perkId$).pipe(shareReplayRefCount(1))

  public readonly icon$ = this.perk$.pipe(map((it) => it?.IconPath || NW_FALLBACK_ICON))
  public readonly name$ = this.perk$.pipe(map((it) => it?.DisplayName))
  public readonly type$ = this.perk$.pipe(map((it) => it?.PerkType))
  public readonly description$ = this.perk$.pipe(map((it) => it?.Description))
  public readonly properties$ = this.perk$.pipe(map((it) => this.getProperties(it))).pipe(shareReplayRefCount(1))
  public readonly affix$ = this.perk$
    .pipe(switchMap((it) => this.db.affixstat(it.Affix)))
    .pipe(map((it) => (it ? this.getAffixProperties(it) : null)))
  public readonly abilityIds$ = this.perk$.pipe(map((it) => it?.EquipAbility?.length ? it?.EquipAbility : null))
  // public readonly ability$ = this.perk$
  //   .pipe(switchMap((it) => this.db.affixstat(it.Affix)))
  //   .pipe(map((it) => (it ? this.getAffixProperties(it) : null)))
  public readonly abilities$ = combineLatest({
    perk: this.perk$,
    abilities: this.db.abilitiesMap,
  }).pipe(
    map(({ perk, abilities }) => {
      return perk.EquipAbility?.map((id) => abilities.get(id))
        .map((it) => (it ? stripAbilityProperties(it) : null))
        .filter((it) => !!it)
    })
  )

  public constructor(private db: NwDbService) {
    //
  }

  public update(entityId: string) {
    this.perkId$.next(entityId)
  }

  public getProperties(item: Perks, exclude?: Array<keyof Perks | '$source'>) {
    if (!item) {
      return []
    }
    exclude = exclude || ['$source', 'IconPath', 'DisplayName', 'Description']
    return Object.entries(item)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .reduce((res, [key, value]) => {
        res[key] = value
        return res
      }, {} as Partial<Perks>)
  }

  public getAffixProperties(item: Affixstats, exclude?: Array<keyof Affixstats | '$source'>) {
    if (!item) {
      return []
    }
    exclude = exclude || ['$source']
    return Object.entries(item)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .reduce((res, [key, value]) => {
        res[key] = value
        return res
      }, {} as Partial<Perks>)
  }
}
