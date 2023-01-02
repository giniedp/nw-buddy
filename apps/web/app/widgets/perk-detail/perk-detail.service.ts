import { Injectable, Output } from '@angular/core'
import { Perks } from '@nw-data/types'
import { combineLatest, map, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { stripAbilityProperties, stripAffixProperties } from '~/nw/utils'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class PerkDetailService {
  public readonly perkId$ = new ReplaySubject<string>(1)
  @Output()
  public readonly perk$ = this.db.perk(this.perkId$).pipe(shareReplayRefCount(1))

  public readonly icon$ = this.perk$.pipe(map((it) => it?.IconPath))
  public readonly name$ = this.perk$.pipe(map((it) => it?.DisplayName))
  public readonly description$ = this.perk$.pipe(map((it) => it?.Description))
  public readonly properties$ = this.perk$.pipe(map((it) => this.getProperties(it))).pipe(shareReplayRefCount(1))
  public readonly affix$ = this.perk$
    .pipe(switchMap((it) => this.db.affixstat(it.Affix)))
    .pipe(map((it) => (it ? stripAffixProperties(it) : null)))
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

  public getProperties(ability: Perks, exclude?: Array<keyof Perks | '$source'>) {
    if (!ability) {
      return []
    }
    exclude = exclude || ['$source', 'PerkID', 'IconPath', 'DisplayName', 'Description']
    return Object.entries(ability)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .map(([key, value]) => ({
        key,
        value,
        valueType: typeof value,
      }))
  }
}
