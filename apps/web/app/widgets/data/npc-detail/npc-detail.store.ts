import { computed, inject } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { uniqBy } from 'lodash'
import { combineLatest, of } from 'rxjs'
import { withStateLoader } from '~/data'
import { humanize } from '~/utils'
import { NpcGroup, NpcInfo, NpcService } from './npc.service'
import { NW_FALLBACK_ICON } from '@nw-data/common'

export interface NpcDetailState {
  npcId: string
  npc: NpcInfo
  groups: NpcGroup[]
}

export const NpcDetailStore = signalStore(
  withState<NpcDetailState>({
    npcId: null,
    npc: null,
    groups: [],
  }),
  withStateLoader(() => {
    const service = inject(NpcService)
    return {
      load(npcId: string) {
        return combineLatest({
          npcId: of(npcId),
          npc: service.npc$(npcId),
          groups: service.groupsByNpcId$(npcId),
        })
      },
    }
  }),
  withComputed(({ npc, groups }) => {
    return {
      siblings: computed(() => {
        const result = groups()
          ?.map((it) => it.npcs)
          .flat()
        return uniqBy(result, (it) => it.id)
      }),
      name: computed(() => npc()?.data?.GenericName || humanize(npc()?.id)),
      title: computed(() => npc()?.data?.Title),
      icon: computed(() => NW_FALLBACK_ICON),
    }
  }),
)
