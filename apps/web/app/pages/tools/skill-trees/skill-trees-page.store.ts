import { computed } from '@angular/core'
import { signalStore, withComputed, withHooks } from '@ngrx/signals'
import { SkillBuildsDB, buildSkillSetRows, withDbRecords, withFilterByTags } from '~/data'
import { withNwData } from '~/data/with-nw-data'

export const SkillTreesPageStore = signalStore(
  withDbRecords(SkillBuildsDB),
  withFilterByTags(),
  withNwData((db) => {
    return {
      abilities: db.abilitiesMap,
    }
  }),
  withComputed(({ records, nwData, recordsAreLoaded, nwDataIsLoaded }) => {
    return {
      rows: computed(() => buildSkillSetRows(records(), nwData()?.abilities)),
      isLoaded: computed(() => recordsAreLoaded() && nwDataIsLoaded()),
    }
  }),
  withHooks({
    onInit(state) {
      state.loadNwData()
    },
  }),
)
