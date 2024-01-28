import { computed } from '@angular/core'
import { signalStore, withComputed } from '@ngrx/signals'
import { SkillBuildsDB, withDbRecord } from '~/data'

export const SkillTreeDetailStore = signalStore(
  withDbRecord(SkillBuildsDB),
  withComputed(({ recordIsLoaded, recordIsReadonly }) => {
    return {
      canEdit: computed(() => recordIsLoaded() && !recordIsReadonly()),
      isLoaded: computed(() => recordIsLoaded()),
    }
  }),
)
