import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { PlayerTitleData } from '@nw-data/generated'
import { catchError, EMPTY, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { rejectKeys } from '~/utils'

export interface PlayerTitleDetailState {
  record: PlayerTitleData
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
}

export const PlayerTitleDetailStore = signalStore(
  withState<PlayerTitleDetailState>({
    record: null,
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ titleId: string }>(),
      },
      private: {
        loadDone: payload<Omit<PlayerTitleDetailState, 'isLoaded' | 'isLoading' | 'hasError'>>(),
        loadError: payload<{ error: any }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoading: true,
        })
      })
      on(actions.loadDone, (state, data) => {
        patchState(state, {
          ...data,
          isLoaded: true,
          isLoading: false,
          hasError: false,
        })
      })
      on(actions.loadError, (state) => {
        patchState(state, {
          isLoading: false,
          hasError: true,
        })
      })
    },
    effects(actions, create) {
      const db = injectNwData()
      return {
        load$: create(actions.load).pipe(
          switchMap(({ titleId }) => db.playerTitlesById(titleId)),
          map((data) => actions.loadDone({ record: data })),
          catchError((error) => {
            console.error(error)
            actions.loadError({ error })
            return EMPTY
          }),
        ),
      }
    },
  }),
  withComputed(({ record }) => {
    return {
      recordId: computed(() => record()?.TitleID),
      type: computed(() => record()?.TitleType),
      title: computed(() => record()?.TitleMale),
      titleFemale: computed(() => record()?.TitleFemale),
      titleNeutral: computed(() => record()?.TitleNeutral),
      description: computed(() => record()?.Description),
      properties: computed(() => selectProperties(record())),
    }
  }),
)

function selectProperties(item: PlayerTitleData) {
  const reject: Array<keyof PlayerTitleData> = ['TitleMale', 'TitleFemale', 'TitleNeutral', 'Description', 'TitleType']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
