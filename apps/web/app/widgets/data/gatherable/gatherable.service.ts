import { Injectable, inject } from '@angular/core'
import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedVariation } from '@nw-data/scanner'
import { uniq } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { tableIndexBy, tableLookup } from '~/data/nw-data/dsl'
import { combineLatestOrEmpty, eqCaseInsensitive, selectStream } from '~/utils'

export interface GatherableRecord extends GatherableData {
  $meta: ScannedGatherable
  $variations: GatherableVariationRecord[]
  $lootTables: string[]
}

export interface GatherableVariationRecord extends GatherableVariation {
  $meta: ScannedVariation
}

@Injectable({ providedIn: 'root' })
export class GatherableService {
  private db = inject(NwDataService)

  public gatherables$ = selectStream(
    {
      gatherables: this.db.gatherables,
      gatherablesMetaMap: this.db.gatherablesMetadataMap,
      variationsByGatherableIdMap: this.db.gatherableVariationsByGatherableIdMap,
      variationsMetaMap: this.db.variationsMetadataMap,
    },
    ({ gatherables, gatherablesMetaMap, variationsMetaMap, variationsByGatherableIdMap }) => {
      return gatherables.map((gatherable) => {
        const gatherableId = gatherable.GatherableID
        const gatherableMeta = gatherablesMetaMap.get(gatherableId)
        const variations = variationsByGatherableIdMap.get(gatherableId) || []
        const lootTables: string[] = []
        if (!isLootTableEmpty(gatherable.FinalLootTable)) {
          appendToArray(lootTables, gatherable.FinalLootTable)
        }

        const result: GatherableRecord = {
          ...gatherable,
          $meta: gatherableMeta,
          $lootTables: lootTables,
          $variations: variations.map((variation) => {
            const meta = variationsMetaMap.get(variation.VariantID)
            for (const it of variation.Gatherables || []) {
              for (const table of it.LootTable || []) {
                if (!isLootTableEmpty(table)) {
                  appendToArray(lootTables, table)
                }
              }
            }
            return {
              ...variation,
              $meta: meta,
            }
          }),
        }
        return result
      })
    },
  )
  public gatherablesMap$ = tableIndexBy(
    () => this.gatherables$,
    (it) => it.GatherableID,
  )
  public gatherable$ = tableLookup(() => this.gatherablesMap$)

  public gatherables(gatherableIds$: Observable<string[]>) {
    return gatherableIds$.pipe(
      switchMap((list) => {
        return combineLatestOrEmpty(
          (list || []).map((it) => {
            return this.gatherable$(of(it))
          }),
        )
      }),
    )
  }

  public positionChunks(gatherableIds$: Observable<string[]>) {
    return gatherableIds$.pipe(
      switchMap((list) => combineLatestOrEmpty((list || []).map((it) => this.gatherable$(of(it))))),
      map((gatherables) => {
        const variations = gatherables.map((it) => it.$variations || []).flat()
        const positionInfos = variations.map((it) => it.$meta?.spawns || []).flat()
        return uniq(positionInfos.map((it) => it.positions.chunkID))
      }),
      switchMap((chunkIds) => {
        return combineLatestOrEmpty(
          chunkIds.map((it) => {
            return combineLatest({
              chunk: of(it),
              data: this.db.variationsChunk(it),
            })
          }),
        )
      }),
    )
  }
}

export function isLootTableEmpty(lootTable: string): boolean {
  return !lootTable || eqCaseInsensitive(lootTable, 'Empty')
}

function appendToArray(array: string[], value: string): string[] {
  if (!array.some((it) => eqCaseInsensitive(it, value))) {
    array.push(value)
  }
  return array
}

export function getGatherableSpawnCount(gatherable: GatherableRecord) {
  let sum = 0
  if (gatherable?.$meta?.spawns?.length) {
    for (const spawn of gatherable.$meta.spawns) {
      sum += spawn.positions.length
    }
  }
  if (gatherable?.$variations?.length) {
    for (const variation of gatherable?.$variations) {
      for (const entry of variation.$meta?.spawns || []) {
        sum += entry.positions.elementCount
      }
    }
  }
  return sum
}
