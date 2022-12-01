import { Injectable } from '@angular/core'
import { Attributeconstitution } from '@nw-data/types'
import { combineLatest, map, Observable, of } from 'rxjs'
import { mapGroupBy, shareReplayRefCount, tapDebug } from '~/utils'
import { AttributeRef, NW_ATTRIBUTE_TYPES } from './nw-attributes'
import { NwDbService } from './nw-db.service'

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
    return level.pipe(map((level) => HP_LOOKUP[level - 1] || 0))
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

function baseHpTable(db: NwDbService) {
  return db.xpAmounts.pipe(
    map((table) => {
      let value = 729
      return table.map((it) => {
        value = value + it.Health
        return {
          level: it['Level Number'],
          hp: value,
        }
      })
    })
  )
}

const HP_LOOKUP = [
  729, 779, 784, 791, 802, 815, 832, 851, 874, 899, 928, 959, 994, 1031, 1072, 1115, 1162, 1211, 1264, 1319, 1378, 1439,
  1504, 1571, 1642, 1715, 1792, 1871, 1954, 2039, 2128, 2219, 2314, 2411, 2512, 2615, 2722, 2831, 2944, 3059, 3178,
  3299, 3424, 3551, 3682, 3815, 3952, 4091, 4234, 4379, 4528, 4679, 4834, 4991, 5152, 5315, 5482, 5651, 5824, 5999,
]
