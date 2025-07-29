import {
  EQUIP_SLOTS,
  EquipSlot,
  getAverageGearScore,
  getItemPerkInfos,
  getItemRarity,
  ItemRarity,
} from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { ItemInstance } from '../items'
import { GearsetRecord } from './types'

export interface GearsetRowSlot {
  slot: EquipSlot
  instance: ItemInstance
  item: MasterItemDefinitions
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

export function selectGearsetRow(
  record: GearsetRecord,
  items: Map<string, MasterItemDefinitions>,
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
