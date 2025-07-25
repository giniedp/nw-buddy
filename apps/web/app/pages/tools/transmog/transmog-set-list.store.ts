import { computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { sortBy } from 'lodash'
import { GearsetsService } from '~/data'
import { BackendService } from '~/data/backend'
import { collectTagsFromRecords, filterRecordsByTags, toggleTagInList } from '~/data/tagging'
import { TransmogsService } from '~/data/transmogs'

export interface TransmogCreationsListPageState {
  userId: string
  activeTags: string[]
  search: string
}

export const TransmogCreationsListPageStore = signalStore(
  withState<TransmogCreationsListPageState>({
    userId: 'local',
    activeTags: [],
    search: '',
  }),
  withProps(({ userId }) => {
    const service = inject(TransmogsService)
    const backend = inject(BackendService)
    const records = rxResource({
      params: userId,
      stream: ({ params }) => service.observeRecords(params),
      defaultValue: [],
    })

    return {
      records: computed(() => (records.hasValue() ? records.value() : [])),
      isLoading: computed(() => records.isLoading()),
      isAvailable: computed(() => {
        return userId() === 'local' || userId() === backend.session()?.id
      }),
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
    }
  }),
  withComputed(({ records, search, activeTags }) => {
    const tags = computed(() => collectTagsFromRecords(records(), activeTags()))
    const filteredRecords = computed(() => {
      let result = filterRecordsByTags(records(), activeTags())
      if (search()) {
        result = result.filter((it) => it.name.toLowerCase().includes(search().toLowerCase()))
      }
      return sortBy(result, (it) => it.name)
    })
    return {
      tags,
      filteredRecords,
    }
  }),
)
