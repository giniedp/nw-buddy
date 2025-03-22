import { inject } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { MountData } from '@nw-data/generated'
import { ModelItemInfo, ModelsService } from '~/widgets/model-viewer'
import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { combineLatest, of } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'

export interface MountDetailState {
  mountId: string
  mount: MountData
  models: ModelItemInfo[]
}

export const MountDetailStore = signalStore(
  withState<MountDetailState>({
    mountId: null,
    mount: null,
    models: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    const ms = inject(ModelsService)
    return {
      load: (id: string) =>
        combineLatest({
          mountId: of(id),
          mount: db.mountsById(id),
          models: ms.byMountId(of(id)),
        }),
    }
  }),
  withComputed(({ mount }) => {
    return {
      icon: computed(() => mount()?.IconPath || NW_FALLBACK_ICON),
      name: computed(() => mount()?.DisplayName),
      description: computed(() => mount()?.Description),
      type: computed(() => mount()?.SourceType),
      unlockMethod: computed(() => mount()?.UnlockMethod),
      source: computed(() => mount()?.SourceType),
    }
  }),
)
