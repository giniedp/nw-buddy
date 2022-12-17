import { Injectable } from '@angular/core'
import { Attributeconstitution } from '@nw-data/types'
import { combineLatest, map, Observable, of } from 'rxjs'
import { mapGroupBy, shareReplayRefCount, tapDebug } from '~/utils'
import { AttributeRef, NW_ATTRIBUTE_TYPES } from './nw-attributes'
import { NwDbService } from '../nw-db.service'

@Injectable({ providedIn: 'root' })
export class NwAttributesService {
  public all$ = of(NW_ATTRIBUTE_TYPES)

  public constructor(private db: NwDbService) {
    //
  }

  public levels(ref: AttributeRef) {
    switch (resolveShortType(ref)) {
      case 'con':
        return this.db.attrCon
      case 'str':
        return this.db.attrStr
      case 'foc':
        return this.db.attrFoc
      case 'int':
        return this.db.attrInt
      case 'dex':
        return this.db.attrDex
      default:
        return of<Attributeconstitution[]>([])
    }
  }

  public abilitiesLevels(ref: AttributeRef) {
    return this.levels(ref)
      .pipe(
        map((table) => {
          return table
            .filter((it) => it.EquipAbilities?.length)
            .map((it) => ({
              Level: it.Level,
              EquipAbilities: it.EquipAbilities,
            }))
        })
      )
      .pipe(shareReplayRefCount(1))
  }

  public unlockedAbilities(ref: AttributeRef, level: number) {
    return combineLatest({
      abilities: this.db.abilitiesMap,
      levels: this.abilitiesLevels(ref),
    }).pipe(
      map(({ abilities, levels }) => {
        return levels
          .filter((it) => level >= it.Level)
          .map((it) => it.EquipAbilities.map((id) => abilities.get(id)))
          .flat(1)
      })
    )
  }

  public healthContributionFromLevel(level: Observable<number>) {
    // HINT: 778 base value is from vitals.json "VitalsID": "Player"
    return level.pipe(map((level) => 778 + 1.5 * Math.pow(level - 1, 2)))
  }

  public healthContributionFromConstitution(constitution: Observable<number>) {
    return combineLatest({
      table: this.db.attrCon.pipe(mapGroupBy((it) => String(it.Level))),
      con: constitution,
    }).pipe(
      map(({ table, con }) => {
        return table[con]?.[0]?.Health
      })
    )
  }
}

function resolveShortType(type: string) {
  if (!type) {
    return null
  }
  if (type.length !== 3) {
    type = type.substring(0, 3)
  }
  return type.toLowerCase()
}
