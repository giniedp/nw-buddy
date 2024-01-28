import { Injectable } from '@angular/core'
import { LootTable } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { Observable, combineLatest, map } from 'rxjs'
import { LootContext } from './loot-context'
import { buildLootGraph, collectLootIds, updateLootGraph } from './loot-graph'
import { NwDataService } from '~/data'

@Injectable({ providedIn: 'root' })
export class NwLootService {
  public constructor(private db: NwDataService) {
    //
  }

  public buildGraph(table: LootTable) {
    return combineLatest({
      tables: this.db.lootTablesMap,
      buckets: this.db.lootBucketsMap,
    }).pipe(
      map(({ tables, buckets }) => {
        return buildLootGraph({
          entry: table,
          tables,
          buckets,
        })
      })
    )
  }

  public resolveLootItems(
    table: LootTable,
    context: LootContext
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      graph: this.buildGraph(table),
      items: this.db.itemsMap,
      housings: this.db.housingItemsMap,
    }).pipe(
      map(({ graph, items, housings }) => {
        graph = updateLootGraph({ graph, context })
        const itemIds = collectLootIds(graph)
        return Array.from(itemIds.values()).map((id) => items.get(id) || housings.get(id))
      })
    )
  }
}
