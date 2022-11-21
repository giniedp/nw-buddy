import { Injectable } from '@angular/core'
import { Attributeconstitution } from '@nw-data/types'
import { combineLatest, map, of } from 'rxjs'
import { NW_ATTRIBUTE_TYPES } from './nw-attributes'
import { NwDbService } from './nw-db.service'

@Injectable({ providedIn: 'root' })
export class NwAttributesService {
  public all$ = of(NW_ATTRIBUTE_TYPES)

  public constructor(private db: NwDbService) {
    //
  }

  public levels(type: string) {
    switch (resolveShortType(type)) {
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

  public abilitiesLevels(type: string) {
    return this.levels(type).pipe(map((table) => {
      return table
        .filter((it) => it.EquipAbilities?.length)
        .map((it) => ({
          Level: it.Level,
          EquipAbilities: it.EquipAbilities
        }))
    }))
  }

  public unlockedAbilities(type: string, level: number) {
    combineLatest({
      abilities: this.db.abilitiesMap,
      levels: this.abilitiesLevels(type)
    }).pipe(map(({ abilities, levels }) => {
      return levels
        .filter((it) => it.Level >= level)
        .map((it) => it.EquipAbilities.map((id) => abilities.get(id)))
    }))
  }

  public weaponDamage() {

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
