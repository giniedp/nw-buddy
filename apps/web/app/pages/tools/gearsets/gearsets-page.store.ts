import { computed } from '@angular/core'
import { signalStore, withComputed } from '@ngrx/signals'
import { GearsetRecord, GearsetsDB, withDbRecords, withFilterByQuery, withFilterByTags } from '~/data'

export const GearsetsPageStore = signalStore(
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
      })
    }
  })
)
