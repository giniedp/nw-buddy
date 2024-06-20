import { computed, inject } from '@angular/core'
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals'
import { GatherableVariation, NW_FALLBACK_ICON, getGatherableNodeSize, getGatherableNodeSizes } from '@nw-data/common'
import { GatherableData, GatherablesMetadata, VariationsMetadata } from '@nw-data/generated'
import { sortBy, uniq } from 'lodash'
import { withNwData } from '~/data/with-nw-data'
import { eqCaseInsensitive } from '~/utils'
import { NodeSize } from '~/widgets/world-map/constants'
import { GatherableRecord, GatherableService, getGatherableSpawnCount } from '../gatherable/gatherable.service'
import { getGatherableIcon } from './utils'

export interface GatherableDetailState {
  gatherableId: string
  variantId: string
}

export interface GatherableSibling {
  size: NodeSize
  gatherableId: string
  gatherable: GatherableData
  gatherableMeta: GatherablesMetadata
  variations: Array<{
    variation: GatherableVariation
    variationMeta: VariationsMetadata
  }>
}

export const GatherableDetailStore2 = signalStore(
  withState<GatherableDetailState>({ gatherableId: null, variantId: null }),
  withNwData((db, service = inject(GatherableService)) => {
    return {
      gatherablesMap: service.gatherablesMap$,
    }
  }),
  withHooks({
    onInit: (state) => state.loadNwData(),
  }),
  withComputed(({ gatherableId, variantId, nwData }) => {
    const gatherable = computed(() => nwData().gatherablesMap?.get(gatherableId()))
    const size = computed(() => getGatherableNodeSize(gatherableId()))
    const sizeSiblings = computed(() => {
      const result: Array<{ size: NodeSize; item: GatherableRecord }> = []
      if (!size()) {
        return result
      }
      for (const siblingSize of getGatherableNodeSizes()) {
        const siblingId = gatherableId().replace(size(), siblingSize)

        const sibling = nwData().gatherablesMap?.get(siblingId)
        if (sibling) {
          result.push({
            size: siblingSize,
            item: sibling,
          })
        }
      }
      if (!result.length) {
        return null
      }
      return result
    })
    return {
      gatherable,
      icon: computed(() => getGatherableIcon(gatherable()) || NW_FALLBACK_ICON),
      name: computed(() => gatherable()?.DisplayName),
      size,
      sizeSiblings,
      tradeSkill: computed(() => gatherable()?.Tradeskill),
      lootTable: computed(() => gatherable()?.FinalLootTable),
      baseGatherTime: computed(() => secondsToDuration(gatherable()?.BaseGatherTime)),
      minRespawnRate: computed(() => secondsToDuration(gatherable()?.MinRespawnRate)),
      maxRespawnRate: computed(() => secondsToDuration(gatherable()?.MaxRespawnRate)),
      variations: computed(() => sortBy(gatherable()?.$variations || [], (it) => it.Name || it.VariantID)),
      lootTables: computed(() => {
        const result: string[] = []
        if (!gatherable()) {
          return result
        }
        if (gatherable().FinalLootTable) {
          result.push(gatherable().FinalLootTable)
        }
        for (const variation of gatherable().$variations || []) {
          result.push(variation.LootTable)
        }
        return uniq(result).filter((it) => !!it && !eqCaseInsensitive(it, 'Empty'))
      }),
      idsForMap: computed(() => {
        const result: string[] = [gatherableId()]
        const siblings = sizeSiblings() || []
        for (const sibling of siblings) {
          if (getGatherableSpawnCount(sibling.item) >= 10000){
            return result
          }
        }
        for (const sibling of sizeSiblings() || []) {
          result.push(sibling.item.GatherableID)
        }
        return uniq(result)
          .filter((it) => !!it)
          .sort()
      }),
    }
  }),
  withComputed(({ size, gatherableId, nwData }) => {
    return {}
  }),
)

function secondsToDuration(value: number) {
  const milliseconds = Math.floor(value * 1000) % 1000
  const seconds = Math.floor(value % 60)
  const minutes = Math.floor(value / 60) % 60
  const hours = Math.floor(value / 3600) % 24
  const days = Math.floor(value / 86400)
  const result = []
  if (milliseconds) {
    result.push(`${milliseconds}ms`)
  }
  if (seconds) {
    result.push(`${seconds}s`)
  }
  if (minutes) {
    result.push(`${minutes}m`)
  }
  if (hours) {
    result.push(`${hours}h`)
  }
  if (days) {
    result.push(`${days}d`)
  }
  return result.reverse().join(' ')
}
