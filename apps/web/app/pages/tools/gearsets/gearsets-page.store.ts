import { signalStore } from '@ngrx/signals'
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
)
