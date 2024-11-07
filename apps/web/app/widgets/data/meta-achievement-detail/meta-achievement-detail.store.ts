import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { MetaAchievementData } from '@nw-data/generated'
import { catchError, EMPTY, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { humanize, rejectKeys } from '~/utils'

export interface MetaAchievementDetailState {
  record: MetaAchievementData
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
}

export const MetaAchievementDetailStore = signalStore(
  withState<MetaAchievementDetailState>({
    record: null,
    isLoaded: false,
    isLoading: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ achievementId: string }>(),
      },
      private: {
        loadDone: payload<Omit<MetaAchievementDetailState, 'isLoaded' | 'isLoading' | 'hasError'>>(),
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
          switchMap(({ achievementId }) => db.metaAchievementsById(achievementId)),
          map((record) => actions.loadDone({ record })),
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
      achievementId: computed(() => record()?.AchievementsID),
      icon: computed(() => record()?.Icon || NW_FALLBACK_ICON),
      title: computed(() => record()?.Title),
      description: computed(() => record()?.Description),
      displayCategory: computed(() => humanize(record()?.UIDisplayCategory)),
      tierLabel: computed(() => record()?.Tier),
      properties: computed(() => selectProperties(record())),
    }
  }),
)

function selectProperties(item: MetaAchievementData) {
  const reject: Array<keyof MetaAchievementData> = ['Title', 'Description', 'Icon', 'UIDisplayCategory', 'Tier']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
