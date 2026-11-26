import { EquipSlotId } from '@nw-data/common'
import type { AppDbRecord } from '../app-db'

export type TransmogSlotId = Extract<EquipSlotId, 'head' | 'chest' | 'hands' | 'legs' | 'feet'>
export interface TransmogRecord extends AppDbRecord {
  /**
   * Name of the set
   */
  name: string
  /**
   * User description about the set
   */
  description?: string
  /**
   * User defined tags
   */
  tags?: string[]

  /**
   * Item slots for this gear
   */
  slots?: Partial<Record<TransmogSlotId, TransmogSlot>>
  /**
   * Gender appearance
   */
  gender?: 'male' | 'female'
  /**
   * The emote the character plays (`EmoteData.UniqueTagID`), none plays the idle
   */
  emote?: string | null
  /**
   * The weapons the character carries, none: unarmed
   */
  weapons?: TransmogWeapons | null
  /**
   * The status of the skill set
   */
  status?: 'public' | 'private'
}

/**
 * The weapon appearances of a set (`WeaponAppearanceID`): two weapons and a shield (`weapon3`), slot names as the gear
 * sets'
 */
export interface TransmogWeapons {
  weapon1?: string | null
  weapon2?: string | null
  weapon3?: string | null
}

export interface TransmogSlot {
  item: string
  dyeR: number
  dyeG: number
  dyeB: number
  dyeA: number
  /**
   * Body parts the user hides (bit 1 the first, bit 2 the second part of the slot)
   */
  flag: number
  /**
   * Body parts the user shows although the worn rows hide them, bits as {@link flag}; only the character editor
   * reads it
   */
  show?: number
}
