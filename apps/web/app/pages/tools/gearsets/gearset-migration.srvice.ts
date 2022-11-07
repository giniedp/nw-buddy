import { Injectable } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { firstValueFrom } from 'rxjs'
import { GearsetRecord, GearsetsDB, ItemInstance } from '~/data'
import { NwDbService } from '~/nw'
import { getItemMaxGearScore } from '~/nw/utils'
import { PreferencesService, StorageScopeNode } from '~/preferences'

@Injectable({ providedIn: 'root' })
export class GearsetMigrationService {
  private oldStore: StorageScopeNode
  public constructor(pref: PreferencesService, private gearDB: GearsetsDB, private nwDB: NwDbService) {
    this.oldStore = pref.storage.storageScope('gearbuilder:')
  }

  public async run() {
    await this.migrate().catch(console.error)
  }

  private async migrate() {
    const oldKeys = this.oldStore.keys()
    if (!oldKeys?.length) {
      return
    }
    const oldGears = oldKeys.map((key) => ({
      id: key,
      record: this.oldStore.get<OldGearsetRecord>(key),
    }))

    const items = await firstValueFrom(this.nwDB.itemsMap)
    const existingGears = await this.gearDB.table.where('id').anyOf(oldKeys).toArray()
    const existingKeys = existingGears.map((it) => it.id)
    const toImport = oldGears
      .filter((it) => !existingKeys.includes(it.id))
      .map((it): GearsetRecord => mapRecord(it.id, it.record, items))
    await this.gearDB.table.bulkAdd(toImport)
    this.oldStore.clear()
  }
}

function mapRecord(id: string, old: OldGearsetRecord, items: Map<string, ItemDefinitionMaster>): GearsetRecord {
  return {
    id: id,
    name: old.name,
    tags: [],
    slots: Object.entries(old.items || {})
      .map(([slot, instance]): [string, ItemInstance] => {
        return [
          slot,
          {
            itemId: instance.itemId,
            gearScore: instance.gearScore || getItemMaxGearScore(items.get(instance.itemId)),
            perks: instance.perks,
          },
        ]
      })
      .reduce((res, [slot, instance]) => {
        res[slot] = instance
        return res
      }, {}),
  }
}

export type OldGearsetRecord = {
  name?: string
  items?: Record<string, OldGearsetItem>
}

export type OldGearsetItem = {
  itemId?: string
  gearScore?: number
  perks?: Record<string, string>
}
