import { computed, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals'
import { of } from 'rxjs'
import { GearsetRecord, GearsetsDB, withDbRecords, withFilterByQuery, withFilterByTags } from '~/data'
import { BackendService } from '~/data/backend'

export const GearsetsListPageStore = signalStore(
  withDbRecords(GearsetsDB),
  withFilterByTags<GearsetRecord>(),
  withFilterByQuery<GearsetRecord>((record, filter) => {
    return (
      String(record.name || '')
        .toLowerCase()
        .includes(filter) ||
      String(record.description || '')
        .toLowerCase()
        .includes(filter)
    )
  }),
  withComputed(({ filteredRecords }) => {
    return {
      filteredRecords: computed(() => {
        return [
          null, // placeholder for "create new"
          ...(filteredRecords() || []).sort((a, b) => {
            return (a.name || '').localeCompare(b.name || '')
          }),
        ]
      }),
    }
  }),

  withMethods(() => {
    const backend = inject(BackendService)
    return {
      autoSync: () => backend.privateTables.gearsets?.autoSync$ || of(null),
    }
  }),
  withHooks({
    onInit(state) {
      state.autoSync().pipe(takeUntilDestroyed()).subscribe()
    },
  }),

)
