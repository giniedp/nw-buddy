import { Injectable } from '@angular/core'
import { GatherableVariation } from '@nw-data/common'
import { GatherableData } from '@nw-data/generated'
import { ScannedGatherable, ScannedGatherableSpawn, ScannedVariation } from '@nw-data/generated'
import { uniq } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
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
  private db = injectNwData()

  public gatherables$ = selectStream(
    {
      gatherables: this.db.gatherablesAll(),
      gatherablesMetaMap: this.db.gatherablesMetadataByIdMap(),
      variationsByGatherableIdMap: this.db.gatherableVariationsByGatherableIdMap(),
      variationsMetaMap: this.db.variationsMetadataByIdMap(),
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

  public gatherablesForDownload(gatherableIds$: Observable<string[]>) {
    return combineLatest({
      dataMap: this.gatherablesMap$,
      dataIds: gatherableIds$,
      chunks: this.positionChunks(gatherableIds$),
    }).pipe(
      map(({ dataMap, dataIds, chunks }) => {
        const result: Array<{
          gatherableID: string
          lootTable: string
          spawns: ScannedGatherableSpawn[]
          variations: Array<{
            variationID: string
            lootTable: string[]
            spawns: Array<{
              mapID: string
              positions: Array<[number, number]>
            }>
          }>
        }> = []
        for (const gatherableId of dataIds) {
          const data = dataMap.get(gatherableId)
          if (!data) {
            continue
          }
          const item: (typeof result)[0] = {
            gatherableID: data.GatherableID,
            lootTable: data.FinalLootTable,
            spawns: [],
            variations: [],
          }
          for (const spawn of data.$meta?.spawns || []) {
            item.spawns.push(spawn)
          }
          for (const variation of data.$variations || []) {
            const spawns = variation.$meta?.spawns || []
            item.variations.push({
              variationID: variation.VariantID,
              lootTable: variation.Gatherables.find((it) => eqCaseInsensitive(it.GatherableID, gatherableId))
                ?.LootTable,
              spawns: spawns.map(({ mapID, positions }) => {
                const chunk = chunks.find((it) => it.chunk === positions.chunkID)
                return {
                  mapID: mapID,
                  positions: chunk.data.slice(
                    positions.elementOffset,
                    positions.elementOffset + positions.elementCount,
                  ),
                }
              }),
            })
          }
          result.push(item)
        }
        return result
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
