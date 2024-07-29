import { computed, inject } from '@angular/core'
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals'
import { uniqBy } from 'lodash'
import { NwDataService } from '~/data'
import { withNwData } from '~/data/with-nw-data'
import { humanize, selectSignal } from '~/utils'
import { NpcService } from './npc.service'

export interface NpcDetailState {
  recordId: string
}

export const NpcDetailStore = signalStore(
  { protectedState: false },
  withState<NpcDetailState>({
    recordId: null,
  }),
  withComputed(({ recordId }) => {
    const service = inject(NpcService)

    const npc = selectSignal(service.npc$(recordId))
    const groups = selectSignal(service.groupsByNpcId$(recordId), (list) => list || [])
    const siblings = computed(() => {
      const result = groups()
        ?.map((it) => it.npcs)
        .flat()
      return uniqBy(result, (it) => it.id)
    })
    return {
      npc,
      siblings,
      name: computed(() => npc()?.data?.GenericName || humanize(npc()?.id) ),
      title: computed(() => npc()?.data?.Title),
    }
  }),
)
