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
   * The status of the skill set
   */
  status?: 'public' | 'private'
}

export interface TransmogSlot {
  item: string
  dyeR: number
  dyeG: number
  dyeB: number
  dyeA: number
  flag: number
}
