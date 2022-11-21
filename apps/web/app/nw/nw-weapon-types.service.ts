import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { defer, map, of } from 'rxjs'
import { eqCaseInsensitive, mapGroupBy, mapRecordEntries, shareReplayRefCount } from '~/utils'
import { NwDbService } from './nw-db.service'
import { NW_DAMAGE_TYPE_ICONS, NW_WARD_TYPE_ICONS, NW_WEAPON_TYPES } from './nw-weapon-types'

@Injectable({ providedIn: 'root' })
export class NwWeaponTypesService {
  public readonly all$ = defer(() => of(NW_WEAPON_TYPES))
  public readonly byDamageType$ = defer(() => this.all$).pipe(map((table) => groupBy(table, (it) => it.DamageType)))
  public readonly categories$ = defer(() => this.all$)
    .pipe(mapGroupBy((it) => it.CategoryName))
    .pipe(
      mapRecordEntries(([name, weapons]) => ({
        name,
        weapons,
      }))
    )
    .pipe(shareReplayRefCount(1))

  public get damagetypes() {
    return this.db.damagetypes
  }

  public forWeaponTag(tag: string) {
    return this.all$.pipe(map((types) => types.find((it) => eqCaseInsensitive(it.WeaponTag, tag))))
  }

  public damageTypeIcon(type: string) {
    return NW_DAMAGE_TYPE_ICONS.get(type) || NW_DAMAGE_TYPE_ICONS.get('unknown')
  }

  public wardTypeIcon(type: string) {
    return NW_WARD_TYPE_ICONS.get(type)
  }

  public constructor(private db: NwDbService) {

  }
}
