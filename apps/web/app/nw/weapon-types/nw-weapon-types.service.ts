import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { defer, map, of } from 'rxjs'
import { CaseInsensitiveMap, eqCaseInsensitive, mapGroupBy, mapRecordEntries, shareReplayRefCount } from '~/utils'
import { NW_WEAPON_TYPES } from './nw-weapon-types'

@Injectable({ providedIn: 'root' })
export class NwWeaponTypesService {
  public readonly all$ = defer(() => of(NW_WEAPON_TYPES))
  public readonly byTag$ = defer(() => of(NW_WEAPON_TYPES)).pipe(
    map((list) => new CaseInsensitiveMap(list.map((it) => [it.WeaponTag, it]))),
  )
  public readonly byDamageType$ = defer(() => this.all$).pipe(map((table) => groupBy(table, (it) => it.DamageType)))
  public readonly categories$ = defer(() => this.all$)
    .pipe(mapGroupBy((it) => it.CategoryName))
    .pipe(
      mapRecordEntries(([name, weapons]) => ({
        name,
        weapons,
      })),
    )
    .pipe(shareReplayRefCount(1))

  public forWeaponTag(tag: string) {
    return this.all$.pipe(map((types) => types.find((it) => eqCaseInsensitive(it.WeaponTag, tag))))
  }
}
