import { computed, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals'
import { of } from 'rxjs'
import { SkillBuildsDB, buildSkillSetRows, withDbRecords, withFilterByTags } from '~/data'
import { BackendService } from '~/data/backend'
import { withNwData } from '~/data/with-nw-data'

export const SkillTreesPageStore = signalStore(
  withDbRecords(SkillBuildsDB),
  withFilterByTags(),
  withNwData((db) => {
    return {
      abilities: db.abilitiesByIdMap(),
    }
  }),
  withComputed(({ filteredRecords, nwData, recordsAreLoaded, nwDataIsLoaded }) => {
    return {
      rows: computed(() => buildSkillSetRows(filteredRecords(), nwData()?.abilities)),
      isLoaded: computed(() => recordsAreLoaded() && nwDataIsLoaded()),
    }
  }),
  withMethods(() => {
    const backend = inject(BackendService)
    return {
      autoSync: () => backend.privateTables.skillSets?.autoSync$ || of(null),
    }
  }),
  withHooks({
    onInit(state) {
      state.loadNwData()
      state.autoSync().pipe(takeUntilDestroyed()).subscribe()
    },
  }),
)
