import { Injectable } from '@angular/core'
import { LootTable } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { combineLatest, map, Observable } from 'rxjs'
import { injectNwData } from '~/data'
import { LootContext } from './loot-context'
import { buildLootGraph, collectLootIds, updateLootGraph } from './loot-graph'

@Injectable({ providedIn: 'root' })
export class NwLootService {
  private db = injectNwData()

  public buildGraph(table: LootTable) {
    return combineLatest({
      tables: this.db.lootTablesByIdMap(),
      buckets: this.db.lootBucketsByIdMap(),
    }).pipe(
      map(({ tables, buckets }) => {
        return buildLootGraph({
          entry: table,
          tables,
          buckets,
        })
      }),
    )
  }

  public resolveLootItems(
    table: LootTable,
    context: LootContext,
  ): Observable<Array<MasterItemDefinitions | HouseItems>> {
    return combineLatest({
      graph: this.buildGraph(table),
      items: this.db.itemsByIdMap(),
      housings: this.db.housingItemsByIdMap(),
    }).pipe(
      map(({ graph, items, housings }) => {
        graph = updateLootGraph({ graph, context })
        const itemIds = collectLootIds(graph)
        return Array.from(itemIds.values()).map((id) => items.get(id) || housings.get(id))
      }),
    )
  }
}
