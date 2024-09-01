import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { ConsumableItemDefinitions } from '@nw-data/generated'
import { EMPTY, catchError, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { rejectKeys } from '~/utils'

export interface ConsumableDetailState {
  record: ConsumableItemDefinitions
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
}

export const ConsumableDetailStore = signalStore(
  withState<ConsumableDetailState>({
    record: null,
    isLoading: false,
    isLoaded: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ id: string }>(),
      },
      private: {
        loaded: payload<Pick<ConsumableDetailState, 'record'>>(),
        loadError: payload<{ error: unknown }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.loadError, (state) => {
        patchState(state, {
          record: null,
          isLoading: false,
          hasError: true,
        })
      })
      on(actions.loaded, (state, data) => {
        patchState(state, {
          ...data,
          isLoading: false,
          isLoaded: true,
          hasError: false,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ id }) => db.consumable(id)),
          map((record) => actions.loaded({ record })),
          catchError((error) => {
            console.error(error)
            return EMPTY
          }),
        ),
      }
    },
  }),
  withComputed(({ record }) => {
    return {
      properties: computed(() => selectProperties(record())),
    }
  }),
)
function selectProperties(item: ConsumableItemDefinitions) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
