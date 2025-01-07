import { EquipSlot, ItemRarity } from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'

import { inject } from '@angular/core'
import { signalStore, withHooks, withMethods } from '@ngrx/signals'
import { of } from 'rxjs'
import { BackendService } from '../backend'
import { ItemInstance } from '../items/types'
import { GearsetRecord } from './types'
import { withGearsetsRows } from './with-gearsets'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'


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
  withMethods(() => {
    const backend = inject(BackendService)
    return {
      autoSync: () => backend.privateTables.gearsets?.autoSync$ || of(null),
    }
  }),
  withHooks({
    onInit(state) {
      state.connectDB()
      state.loadNwData()
      state.autoSync().pipe(takeUntilDestroyed()).subscribe()
    },
  }),
)
