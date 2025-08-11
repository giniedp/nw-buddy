import { computed, inject, resource } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { SkillTreesService, buildSkillTreeRows, injectNwData } from '~/data'
import { BackendService } from '~/data/backend'
import { collectTagsFromRecords, filterRecordsByTags, toggleTagInList } from '~/data/tagging'

export interface SkillTreesPageState {
  userId: string
  activeTags: string[]
  tagsOperator: 'AND' | 'OR'
}

export const SkillTreesPageStore = signalStore(
  withState<SkillTreesPageState>({
    userId: 'local',
    activeTags: [],
    tagsOperator: 'OR',
  }),
  withProps(({ userId }) => {
    const db = injectNwData()
    const store = inject(SkillTreesService)
    const backend = inject(BackendService)
    const recordsResource = rxResource({
      params: userId,
      stream: ({ params }) => store.observeRecords(params),
      defaultValue: [],
    })
    const abilitiesResource = resource({
      loader: () => db.abilitiesByIdMap(),
    })
    const records = computed(() => (recordsResource.hasValue() ? recordsResource.value() : []))
    return {
      records,
      abilities: computed(() => (abilitiesResource.hasValue() ? abilitiesResource.value() : null)),
      isLoading: computed(() => recordsResource.isLoading() || abilitiesResource.isLoading()),
      isAvailable: computed(() => {
        return userId() === 'local' || userId() === backend.sessionUserId()
      }),
      isEmpty: computed(() => !records().length),
    }
  }),
  withMethods((state) => {
    return {
      load: signalMethod<string>((userId) => {
        patchState(state, { userId })
      }),
      toggleTag: (tag: string) => {
        patchState(state, {
          activeTags: toggleTagInList(state.activeTags(), tag),
        })
      },
      toggleTagsOperator: () => {
        patchState(state, {
          tagsOperator: state.tagsOperator() === 'OR' ? 'AND' : 'OR',
        })
      },
    }
  }),
  withComputed(({ records, activeTags, abilities, tagsOperator }) => {
    const tags = computed(() => collectTagsFromRecords(records(), activeTags()))
    const filteredRecords = computed(() => filterRecordsByTags(records(), activeTags(), tagsOperator()))
    const displayRows = computed(() => buildSkillTreeRows(filteredRecords(), abilities()))
    return {
      tags,
      displayRows,
      totalCount: computed(() => records().length),
      displayCount: computed(() => displayRows().length),
    }
  }),
)
