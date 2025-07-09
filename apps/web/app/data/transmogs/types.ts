import { EquipSlotId } from '@nw-data/common'
import type { AppDbRecord } from '../app-db'

export type TransmogSlogId = Extract<EquipSlotId, 'head' | 'chest' | 'hands' | 'legs' | 'feet'>
export interface TransmogRecord extends AppDbRecord {
  /**
   * Name of the set
   */
  name: string
  /**
   * The ipns private key
   */
  ipnsKey?: string
  /**
   * The ipns public name
   */
  ipnsName?: string
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
  slots?: Partial<Record<TransmogSlogId, TransmogSlot>>
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
  dyeR: string
  dyeG: string
  dyeB: string
  dyeA: string
}
