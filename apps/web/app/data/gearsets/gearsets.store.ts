import { EquipSlot, ItemRarity, PerkBucket } from '@nw-data/common'
import { ItemDefinitionMaster, Perks } from '@nw-data/generated'

import { signalStore, withHooks } from '@ngrx/signals'
import { ItemInstance } from '../items/types'
import { GearsetRecord } from './types'
import { withGearsetsRows } from './with-gearsets'


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

export type GearsetsStore = InstanceType<typeof GearsetsStore>
export const GearsetsStore = signalStore(
  { providedIn: 'root' },
  withGearsetsRows(),
  withHooks({
    onInit(state) {
      state.connectDB()
      state.loadNwData()
    },
  }),
)
