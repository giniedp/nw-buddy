import { ItemRarity, PerkBucket } from '@nw-data/common'
import { AffixStatData, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import type { AppDbRecord } from '../app-db'

export interface ItemInstance {
  /**
   * New world item id
   */
  itemId: string
  /**
   * Gear score of this item
   */
  gearScore: number
  /**
   * Rolled perks on the item
   */
  perks: Record<string, string>
}

export interface ItemInstanceRecord extends ItemInstance, AppDbRecord {
  /**
   * Whether item is locked. Must be unlocked before edit or delete
   */
  locked?: boolean
}

export interface ItemInstanceRow {
  /**
   * The player item stored in database
   */
  record: ItemInstanceRecord
  /**
   * The game item referenced by the record
   */
  item: MasterItemDefinitions
  /**
   * The game perks referenced by the record
   */
  perks?: Array<{ key: string; perk?: PerkData; affix?: AffixStatData; bucket?: PerkBucket }>
  /**
   * The items current rarity
   */
  rarity?: ItemRarity
}
