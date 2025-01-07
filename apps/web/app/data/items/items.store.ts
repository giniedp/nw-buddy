import { computed, inject } from '@angular/core'

import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals'
import { of } from 'rxjs'
import { BackendService } from '../backend'
import { withDbRecords } from '../with-db-records'
import { withNwData } from '../with-nw-data'
import { ItemInstancesDB } from './items.db'
import { buildItemInstanceRows } from './utils'

export type InventoryItemsStore = InstanceType<typeof InventoryItemsStore>
export const InventoryItemsStore = signalStore(
  withDbRecords(ItemInstancesDB),
  withNwData((db) => {
    return {
      items: db.itemsByIdMap(),
      perks: db.perksByIdMap(),
      affixes: db.affixStatsByIdMap(),
      buckets: db.perkBucketsByIdMap(),
    }
  }),
  withComputed(({ records, nwData, recordsAreLoaded, nwDataIsLoaded }) => {
    const isLoaded = computed(() => recordsAreLoaded() && nwDataIsLoaded())
    return {
      rows: computed(() => (isLoaded() ? buildItemInstanceRows(records(), nwData()) : null)),
      isLoaded: isLoaded,
    }
  }),
  withMethods(() => {
    const backend = inject(BackendService)
    return {
      autoSync: () => backend.privateTables.items?.autoSync$ || of(null),
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
