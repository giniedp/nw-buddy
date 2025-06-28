import { mapResponse } from '@ngrx/operators'
import { EquipSlot, ItemRarity } from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'

import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalStore, type, withHooks, withMethods, withState } from '@ngrx/signals'
import { eventGroup, Events, on, withEffects, withReducer } from '@ngrx/signals/events'
import { of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { ItemInstance } from '../items/types'
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
