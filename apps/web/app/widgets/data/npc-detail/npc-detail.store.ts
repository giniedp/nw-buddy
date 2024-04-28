import { computed, effect, inject } from '@angular/core'
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals'
import { uniqBy } from 'lodash'
import { withNwData } from '~/data/with-nw-data'
import { NpcService } from './npc.service'

export interface NpcDetailState {
  recordId: string
}

export const NpcDetailStore = signalStore(
  withState<NpcDetailState>({
    recordId: null,
  }),
  withNwData((db, service = inject(NpcService)) => {
    return {
      npcsMap: db.npcsMap,
      groupsMap: service.groupByNpcIdMap$,
      variationsMap: db.npcsVariationsByNpcIdMap,
    }
  }),
  withComputed(({ recordId, nwData }) => {
    const npc = computed(() => nwData().npcsMap?.get(recordId()))
    const groups = computed(() => nwData().groupsMap?.get(recordId()) || [])
    const siblings = computed(() => {
      const result = groups()
        ?.map((it) => it.npcs)
        .flat()
      return uniqBy(result, (it) => it.NPCId)
    })
    const variation = computed(() => {
      return nwData().variationsMap?.get(recordId())
    })
    const variations = computed(() => {
      const result = siblings()
        .map((it) => nwData().variationsMap?.get(it.NPCId))
        .filter((it) => !!it)
        .flat()
      return uniqBy(result, (it) => it.VariantID)
    })
    return {
      npc,
      siblings,
      variation,
      variations,
      name: computed(() => npc()?.GenericName),
      title: computed(() => npc()?.Title),
    }
  }),
  withHooks((state) => {
    return {
      onInit() {
        state.loadNwData()
      },
    }
  }),
)
