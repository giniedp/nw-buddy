import { Type, computed, inject } from '@angular/core'
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map, pipe, switchMap } from 'rxjs'
import { DBTable } from './db-table'

export interface WithDbRecordsState<T extends { id: string }> {
  records: T[]
  recordsAreLoaded: boolean
}

export function withDbRecords<T extends { id: string }>(table: Type<DBTable<T>>) {
  return signalStoreFeature(
    withState<WithDbRecordsState<T>>({
      records: null,
      recordsAreLoaded: false,
    }),
    withMethods((state) => {
      const db = inject(table)
      return {
        connectDB: rxMethod<void>(
          pipe(
            switchMap(() => db.observeAll()),
            map((data) =>
              patchState(state, {
                records: data,
                recordsAreLoaded: true,
              }),
            ),
          ),
        ),
        createRecord: async (record: T) => {
          return db.create(record)
        },
        updateRecord: async (record: T) => {
          return db.update(record.id, record)
        },
        destroyRecord: async (id: string | string[]) => {
          return db.destroy(id)
        },
      }
    }),
    withComputed(({ records }) => {
      return {
        filteredRecords: computed(() => records()),
      }
    }),
  )
}
