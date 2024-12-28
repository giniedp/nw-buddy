import { EquipSlot, ItemRarity } from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'

import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalStore, withHooks, withMethods } from '@ngrx/signals'
import { ItemInstance } from '../items/types'
import { SupabaseService } from '../supabase'
import { GearsetsDB } from './gearsets.db'
import { GearsetRecord } from './types'
import { withGearsetsRows } from './with-gearsets'


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
  withMethods(() => {
    const table = inject(GearsetsDB)
    const supabase = inject(SupabaseService)
    return {
      tableSync: () => supabase.tableSync(table)
    }
  }),
)
