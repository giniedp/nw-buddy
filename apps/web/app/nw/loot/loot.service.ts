import { Injectable } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, map, Observable } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import { LootTableEntry } from '../utils'
import { LootContext } from './loot-context'
import { buildLootGraph, collectLootIds, updateLootGraph } from './loot-graph'

@Injectable({ providedIn: 'root' })
export class NwLootService {
  public constructor(private db: NwDbService) {
    //
  }

  public buildGraph(table: LootTableEntry) {
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
    table: LootTableEntry,
    context: LootContext
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return combineLatest({
      graph: this.buildGraph(table),
      items: this.db.itemsMap,
      housings: this.db.housingItemsMap
    }).pipe(map(({ graph, items, housings }) => {
      graph = updateLootGraph({ graph, context })
      const itemIds = collectLootIds(graph)
      return Array.from(itemIds.values()).map((id) => items.get(id) || housings.get(id))
    }))
  }
}
