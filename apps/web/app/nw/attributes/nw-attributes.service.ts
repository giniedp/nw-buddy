import { Injectable } from '@angular/core'
import { Attributeconstitution } from '@nw-data/types'
import { map, of } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { NwDbService } from '../nw-db.service'
import { AttributeRef, NW_ATTRIBUTE_TYPES } from './nw-attributes'

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
