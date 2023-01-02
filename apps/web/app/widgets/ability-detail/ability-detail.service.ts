import { Injectable, Output } from '@angular/core'
import { Ability } from '@nw-data/types'
import { combineLatest, map, ReplaySubject } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class AbilityDetailService {
  public readonly abilityId$ = new ReplaySubject<string>(1)
  @Output()
  public readonly ability$ = combineLatest({
    id: this.abilityId$,
    abilitiesMap: this.db.abilitiesMap,
  })
    .pipe(map(({ id, abilitiesMap }) => abilitiesMap.get(id)))
    .pipe(shareReplayRefCount(1))

  public readonly icon$ = this.ability$.pipe(map((it) => it?.Icon))
  public readonly name$ = this.ability$.pipe(map((it) => it?.DisplayName))
  public readonly description$ = this.ability$.pipe(map((it) => it?.Description))
  public readonly properties$ = this.ability$.pipe(map((it) => this.getProperties(it))).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService) {
    //
  }

  public update(entityId: string) {
    this.abilityId$.next(entityId)
  }

  public getProperties(ability: Ability, exclude?: Array<keyof Ability | '$source'>) {
    if (!ability) {
      return []
    }
    exclude = exclude || ['$source', 'AbilityID', 'Icon', 'DisplayName', 'Description', 'Sound']
    return Object.entries(ability)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .map(([key, value]) => ({
        key,
        value,
        valueType: typeof value,
      }))
  }
}
