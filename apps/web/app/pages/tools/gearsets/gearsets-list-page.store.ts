import { computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { sortBy } from 'lodash'
import { GearsetsService } from '~/data'
import { BackendService } from '~/data/backend'
import { collectTagsFromRecords, filterRecordsByTags, toggleTagInList } from '~/data/tagging'

export interface GearsetsListPageState {
  userId: string
  activeTags: string[]
  tagsOperator: 'AND' | 'OR'
  search: string
}

export const GearsetsListPageStore = signalStore(
  withState<GearsetsListPageState>({
    userId: 'local',
    activeTags: [],
    search: '',
    tagsOperator: 'OR'
  }),
  withProps(({ userId }) => {
    const service = inject(GearsetsService)
    const backend = inject(BackendService)
    const recordsResource = rxResource({
      params: userId,
      stream: ({ params }) => service.observeRecords(params),
      defaultValue: [],
    })

    const records = computed(() => (recordsResource.hasValue() ? recordsResource.value() : []))
    return {
      records,
      isLoading: computed(() => recordsResource.isLoading()),
      isAvailable: computed(() => {
        return userId() === 'local' || userId() === backend.sessionUserId()
      }),
      isEmpty: computed(() => !records().length),
    }
  }),
  withMethods((state) => {
    return {
      connectUser: signalMethod<string>((userId) => {
        patchState(state, { userId })
      }),
      connectSearch: signalMethod<string>((search) => {
        patchState(state, { search })
      }),
      toggleTag: (tag: string) => {
        patchState(state, {
          activeTags: toggleTagInList(state.activeTags(), tag),
        })
      },
      toggleTagsOperator: () => {
        patchState(state, {
          tagsOperator: state.tagsOperator() === 'OR' ? 'AND' : 'OR'
        })
      },
    }
  }),
  withComputed(({ records, search, activeTags, tagsOperator }) => {
    const tags = computed(() => collectTagsFromRecords(records(), activeTags()))
    const displayRecords = computed(() => {
      let result = filterRecordsByTags(records(), activeTags(), tagsOperator())
      if (search()) {
        result = result.filter((it) => it.name.toLowerCase().includes(search().toLowerCase()))
      }
      return sortBy(result, (it) => it.name)
    })
    return {
      tags,
      displayRecords,
      totalCount: computed(() => records().length),
      displayCount: computed(() => displayRecords().length),
    }
  }),
)
