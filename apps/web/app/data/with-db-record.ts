import { Type, computed, inject } from '@angular/core'
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map, pipe, switchMap, tap } from 'rxjs'
import { DBTable } from './db-table'

export interface WithDbRecordState<T extends { id: string }> {
  record: T
  recordIsLoaded: boolean
  recordIsReadonly: boolean
}

export function withDbRecord<T extends { id: string }>(table: Type<DBTable<T>>) {
  return signalStoreFeature(
    withState<WithDbRecordState<T>>({
      record: null,
      recordIsLoaded: false,
      recordIsReadonly: false,
    }),
    withMethods((state) => {
      return {
        setEditable: (value: boolean) => patchState(state, { recordIsReadonly: !value }),
      }
    }),
    withComputed(({ recordIsReadonly, record }) => {
      const recordId = computed(() => record()?.id)
      return {
        recordId,
        recordIsReadonly: computed(() => recordIsReadonly() || !recordId()),
      }
    }),
    withMethods((state) => {
      const db = inject(table)
      return {
        load: rxMethod<string>(
          pipe(
            switchMap((id) => db.observeByid(id)),
            map((data) =>
              patchState(state, {
                record: data,
                recordIsLoaded: true,
              }),
            ),
          ),
        ),
        update: async (record: T) => {
          if (state.recordIsReadonly()) {
            throw new Error('Record is not editable')
          }
          await db.update(state.recordId(), record)
        },
        destroy: async () => {
          if (state.recordIsReadonly()) {
            throw new Error('Record is not editable')
          }
          await db.destroy(state.recordId())
        },
      }
    }),
  )
}
