import { Injectable } from '@angular/core'
import { LootTable } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { combineLatest, from, map, Observable, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { ConstrainedLootContext } from './loot-context'
import { buildLootGraph, collectLootIds, updateLootGraph } from './loot-graph'
import { combineLatestOrEmpty } from '../../utils'

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

  public resolveLootItemsForTables(context: ConstrainedLootContext, tableIds: string[]) {
    return from(Promise.all(tableIds.map((id) => this.db.lootTablesById(id)))).pipe(
      switchMap((tables) => {
        tables = tables.filter((it) => !!it)
        return combineLatestOrEmpty(
          tables.map((table) => {
            return this.resolveLootItems(table, context)
          }),
        )
      }),
      map((lists) => {
        return lists.flat()
      }),
    )
  }

  public resolveLootItems(
    table: LootTable,
    context: ConstrainedLootContext,
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
