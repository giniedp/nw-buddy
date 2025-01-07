import { computed, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals'
import { of } from 'rxjs'
import { SkillBuildsDB, withDbRecord } from '~/data'
import { BackendService } from '~/data/backend'

export const SkillTreeDetailStore = signalStore(
  withDbRecord(SkillBuildsDB),
  withMethods(() => {
    const backend = inject(BackendService)
    return {
      autoSync: () => backend.privateTables.skillSets?.autoSync$ || of(null),
    }
  }),
  withComputed(({ recordIsLoaded, recordIsReadonly }) => {
    return {
      canEdit: computed(() => recordIsLoaded() && !recordIsReadonly()),
      isLoaded: computed(() => recordIsLoaded()),
    }
  }),
  withHooks({
    onInit(state) {
      state.autoSync().pipe(takeUntilDestroyed()).subscribe()
    },
  }),
)
