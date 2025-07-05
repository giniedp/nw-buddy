import { computed, inject, resource } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { SkillBuildsService, buildSkillSetRows, injectNwData } from '~/data'
import { BackendService } from '~/data/backend'
import { collectTagsFromRecords, filterRecordsByTags, toggleTagInList } from '~/data/tagging'

export interface SkillTreesPageState {
  userId: string
  activeTags: string[]
}

export const SkillTreesPageStore = signalStore(
  withState<SkillTreesPageState>({
    userId: 'local',
    activeTags: [],
  }),
  withProps(({ userId }) => {
    const db = injectNwData()
    const store = inject(SkillBuildsService)
    const backend = inject(BackendService)
    const records = rxResource({
      params: userId,
      stream: ({ params }) => store.observeRecords(params),
      defaultValue: [],
    })
    const abilities = resource({
      loader: () => db.abilitiesByIdMap(),
    })
    return {
      records: computed(() => (records.hasValue() ? records.value() : [])),
      abilities: computed(() => (abilities.hasValue() ? abilities.value() : null)),
      isLoading: computed(() => records.isLoading() || abilities.isLoading()),
      isAvailable: computed(() => {
        return userId() === 'local' || userId() === backend.session()?.id
      }),
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
    }
  }),
  withComputed(({ records, activeTags, abilities }) => {
    const tags = computed(() => collectTagsFromRecords(records(), activeTags()))
    const filteredRecords = computed(() => filterRecordsByTags(records(), activeTags()))
    const rows = computed(() => buildSkillSetRows(filteredRecords(), abilities()))
    return {
      tags,
      rows,
    }
  }),
)
