import { Injectable } from '@angular/core'
import { defer, map, of } from 'rxjs'
import { mapGroupBy, mapRecordEntries, shareReplayRefCount } from '~/utils'
import { NW_WEAPON_TYPES } from './nw-weapon-types'

@Injectable({ providedIn: 'root' })
export class NwWeaponTypesService {
  public readonly all$ = defer(() => of(NW_WEAPON_TYPES))

  public readonly categories$ = defer(() => this.all$)
    .pipe(mapGroupBy((it) => it.CategoryName))
    .pipe(
      mapRecordEntries(([name, weapons]) => ({
        name,
        weapons,
      }))
    )
    .pipe(shareReplayRefCount(1))

    public forWeaponTag(tag: string) {
      return this.all$.pipe(map((types) => types.find((it) => it.WeaponTag.toLowerCase() === tag?.toLowerCase())))
    }
}
