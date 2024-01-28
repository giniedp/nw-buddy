import { computed, inject } from '@angular/core'
import { signalStoreFeature, withComputed } from '@ngrx/signals'
import {
  EQUIP_SLOTS,
  EquipSlot,
  ItemRarity,
  getAverageGearScore,
  getItemPerkInfos,
  getItemRarity,
} from '@nw-data/common'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { ItemInstance } from '../items'
import { ItemInstancesDB } from '../items/items.db'
import { tableIndexBy } from '../nw-data/dsl'
import { withDbRecords } from '../with-db-records'
import { withFilterByQuery } from '../with-filter-by-query'
import { withFilterByTags } from '../with-filter-by-tags'
import { withNwData } from '../with-nw-data'
import { GearsetsDB } from './gearsets.db'
import { GearsetRecord } from './types'

export interface GearsetRowSlot {
  slot: EquipSlot
  instance: ItemInstance
  item: ItemDefinitionMaster
  rarity: ItemRarity
}

export interface GearsetRow {
  /**
   * The gearset record in database
   */
  record: GearsetRecord
  /**
   * The total gearscore of this set
   */
  gearScore: number
  /**
   * The total weight of this set
   */
  weight: number
  /**
   *
   */
  slots: Record<string, GearsetRowSlot>
}

export function withGearsetsRows() {
  return signalStoreFeature(
    withDbRecords(GearsetsDB),
    withFilterByTags<GearsetRecord>(),
    withFilterByQuery<GearsetRecord>((record, filter) => {
      const search = filter.toLowerCase()
      return (
        (record.name && record.name.toLowerCase().includes(search)) ||
        (record.description && record.description.toLowerCase().includes(search))
      )
    }),
    withNwData((db) => {
      const itemsDB = inject(ItemInstancesDB)
      return {
        items: db.itemsMap,
        perks: db.perksMap,
        buckets: db.perkBucketsMap,
        instances: tableIndexBy(() => itemsDB.observeAll(), 'id'),
      }
    }),
    withComputed(({ filteredRecords, nwData, nwDataIsLoaded }) => {
      return {
        rows: computed(() => {
          if (!nwDataIsLoaded()) {
            return null
          }
          return filteredRecords().map((it) => selectRow(it, nwData().items, nwData().instances))
        }),
      }
    }),
  )
}

function selectRow(
  record: GearsetRecord,
  items: Map<string, ItemDefinitionMaster>,
  instances: Map<string, ItemInstance>,
): GearsetRow {
  if (!record) {
    return null
  }

  const result: GearsetRow = {
    record: record,
    gearScore: null,
    weight: null,
    slots: {},
  }
  for (const slot of EQUIP_SLOTS) {
    const ref = record.slots?.[slot.id]
    const instance = typeof ref === 'string' ? instances.get(ref) : ref
    const item = instance ? items.get(instance.itemId) : null
    const perkIds = instance ? getItemPerkInfos(item, instance.perks).map((it) => it.perkId) : []
    result.slots[slot.id] = {
      slot: slot,
      instance: instance,
      item: item,
      rarity: getItemRarity(item, perkIds),
    }
  }
  result.gearScore = getAverageGearScore(
    Object.values(result.slots).map((it) => ({ id: it.slot.id, gearScore: it.instance?.gearScore || 0 })),
  )
  result.gearScore = Math.floor(result.gearScore)
  return result
}
