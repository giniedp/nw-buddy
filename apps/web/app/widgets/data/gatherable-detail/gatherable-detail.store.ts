import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, effect, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import {
  GatherableNodeSize,
  GatherableVariation,
  NW_FALLBACK_ICON,
  getGatherableNodeSize,
  getGatherableNodeSizes,
} from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedVariation } from '@nw-data/scanner'
import { sortBy, uniq } from 'lodash'
import { EMPTY, catchError, combineLatest, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { GatherableRecord, GatherableService, isLootTableEmpty } from '../gatherable/gatherable.service'
import { getGatherableIcon } from './utils'

export interface GatherableDetailState {
  gatherableId: string
  gatherable: GatherableRecord
  siblings: Array<{ size: GatherableNodeSize; item: GatherableRecord }>
  isLoaded: boolean
  hasError: boolean
}

export interface GatherableSibling {
  size: GatherableNodeSize
  gatherableId: string
  gatherable: GatherableData
  gatherableMeta: ScannedGatherable
  variations: Array<{
    variation: GatherableVariation
    variationMeta: ScannedVariation
  }>
}

export const GatherableDetailStore = signalStore(
  { protectedState: false },
  withState<GatherableDetailState>({
    gatherableId: null,
    gatherable: null,
    siblings: [],
    isLoaded: false,
    hasError: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ id: string }>(),
      },
      private: {
        loaded: payload<{
          gatherable: GatherableRecord
          siblings: GatherableDetailState['siblings']
        }>(),
        loadError: payload<{ error: any }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoaded: false,
        })
      })
      on(actions.loaded, (state, { gatherable, siblings }) => {
        patchState(state, {
          gatherableId: gatherable.GatherableID,
          gatherable,
          siblings,
          isLoaded: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      const service = inject(GatherableService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ id }) => {
            return combineLatest({
              gatherable: db.gatherable(id),
              variant: db.gatherableVariation(id),
              dataSet: service.gatherablesMap$,
            })
          }),
          switchMap(({ gatherable, variant, dataSet }) => {
            const id = gatherable?.GatherableID || variant?.Gatherables?.[0]?.GatherableID
            const gatherable$ = service.gatherable$(id)
            return combineLatest({
              gatherable: gatherable$,
              siblings: gatherable$.pipe(map((it) => selectSiblings(it, dataSet))),
            })
          }),
          map(({ gatherable, siblings }) => {
            actions.loaded({
              gatherable,
              siblings,
            })
            return null
          }),
          catchError((error) => {
            console.error(error)
            actions.loadError({ error })
            return EMPTY
          }),
        ),
      }
    },
  }),

  withComputed(({ gatherable, siblings }) => {
    const gatherableId = computed(() => gatherable()?.GatherableID)
    return {
      icon: computed(() => getGatherableIcon(gatherable()) || NW_FALLBACK_ICON),
      name: computed(() => gatherable()?.DisplayName),
      size: computed(() => getGatherableNodeSize(gatherableId())),
      tradeSkill: computed(() => gatherable()?.Tradeskill),
      lootTable: computed(() => gatherable()?.FinalLootTable),
      baseGatherTime: computed(() => secondsToDuration(gatherable()?.BaseGatherTime)),
      minRespawnRate: computed(() => secondsToDuration(gatherable()?.MinRespawnRate)),
      maxRespawnRate: computed(() => secondsToDuration(gatherable()?.MaxRespawnRate)),
      restriction: computed(() => gatherable()?.Restriction),
      requiredSkillLevel: computed(() => gatherable()?.RequiredTradeskillLevel),
      requiredStatusEffect: computed(() => gatherable()?.RequiredStatusEffect),
      gameEvent: computed(() => gatherable()?.GameEventID),
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
          for (const gatherable of variation.Gatherables || []) {
            for (const lootTable of gatherable.LootTable || []) {
              result.push(lootTable)
            }
          }
        }
        return uniq(result)
          .filter((it) => !isLootTableEmpty(it))
          .sort()
      }),
      idsForMap: computed(() => {
        const result: string[] = [gatherableId()]
        for (const sibling of siblings()) {
          result.push(sibling.item.GatherableID)
        }
        return uniq(result)
          .filter((it) => !!it)
          .sort()
      }),
    }
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

function selectSiblings(gatherable: GatherableRecord, dataSet: Map<string, GatherableRecord>) {
  const gatherableId = gatherable?.GatherableID
  const size = getGatherableNodeSize(gatherableId)
  const result: Array<{ size: GatherableNodeSize; item: GatherableRecord }> = []
  if (!size) {
    return result
  }
  for (const siblingSize of getGatherableNodeSizes()) {
    const siblingId = gatherableId.replace(size, siblingSize)
    const sibling = dataSet.get(siblingId)
    if (sibling) {
      result.push({
        size: siblingSize,
        item: sibling,
      })
    }
  }
  return result
}
