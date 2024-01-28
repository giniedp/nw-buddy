import { computed } from '@angular/core'

import { signalStore, withComputed, withHooks } from '@ngrx/signals'
import { withDbRecords } from '../with-db-records'
import { withNwData } from '../with-nw-data'
import { ItemInstancesDB } from './items.db'
import { buildItemInstanceRows } from './utils'

export type InventoryItemsStore = InstanceType<typeof InventoryItemsStore>
export const InventoryItemsStore = signalStore(
  { providedIn: 'root' },
  withDbRecords(ItemInstancesDB),
  withNwData((db) => {
    return {
      items: db.itemsMap,
      perks: db.perksMap,
      affixes: db.affixStatsMap,
      buckets: db.perkBucketsMap,
    }
  }),
  withComputed(({ records, nwData, recordsAreLoaded, nwDataIsLoaded }) => {
    const isLoaded = computed(() => recordsAreLoaded() && nwDataIsLoaded())
    return {
      rows: computed(() => isLoaded() ? buildItemInstanceRows(records(), nwData()) : null),
      isLoaded: isLoaded,
    }
  }),
  withHooks({
    onInit(state) {
      state.connectDB()
      state.loadNwData()
    },
  }),
)
