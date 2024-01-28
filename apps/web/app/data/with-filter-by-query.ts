import { Signal, computed } from '@angular/core'
import { patchState, signalStoreFeature, type, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map, pipe } from 'rxjs'

export interface WithFilterByQueryState {
  filterQuery: string
}
export function withFilterByQuery<T>(predicate: (record: T, filter: string) => boolean) {
  return signalStoreFeature(
    {
      signals: type<{
        filteredRecords: Signal<T[]>
      }>(),
    },
    withState<WithFilterByQueryState>({
      filterQuery: '',
    }),
    withComputed(({ filteredRecords, filterQuery }) => {
      return {
        filteredRecords: computed(() => {
          if (!filterQuery()) {
            return filteredRecords()
          }
          return filteredRecords().filter((it) => predicate(it, filterQuery()))
        }),
      }
    }),
    withMethods((state) => {
      return {
        connectFilterQuery: rxMethod<string>(
          pipe(
            map((value) => {
              patchState(state, { filterQuery: value })
            }),
          ),
        ),
      }
    }),
  )
}
