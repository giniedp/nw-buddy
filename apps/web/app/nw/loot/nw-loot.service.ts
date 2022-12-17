import { Injectable } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { groupBy, uniqBy } from 'lodash'
import { combineLatest, map, Observable, of, switchMap } from 'rxjs'
import { NwDbService } from '../nw-db.service'
import { getItemId, LootBucketEntry } from '../utils'
import { LootTableEntry } from '../utils/loottables'
import { NwLootbucketService } from './nw-lootbucket.service'
import { LootContext } from './nw-lootcontext'

export type LootItem = ItemDefinitionMaster | Housingitems

export type LootItemWithNodes = {
  item: LootItem
  nodes: LootItemNode[]
}

export type LootNode = LootItemNode | LootTableNode | LootBucketNode

export interface LootItemNode {
  parent?: LootNode
  type: 'item'
  value: ItemDefinitionMaster | Housingitems
  ref: string
}

export interface LootTableNode {
  parent?: LootNode
  type: 'table'
  value: LootTableEntry
  ref: string
}

export interface LootBucketNode {
  parent?: LootNode
  type: 'bucket'
  value: LootBucketEntry
  ref: string
}

@Injectable({ providedIn: 'root' })
export class NwLootService {
  public constructor(private db: NwDbService, private buckets: NwLootbucketService) {
    //
  }

  /**
   * Resolves items from a loot table by given context
   */
  public resolveItems(
    table: LootTableEntry,
    context: LootContext
  ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    return this.resolve(table, context, null).pipe(map(uniqItems))
  }

  public resolveItemNodes(table: LootTableEntry, context: LootContext) {
    return this.resolve(table, context, null).pipe(map(uniqItemNodes))
  }

  private resolve(table: LootTableEntry, context: LootContext, parent?: LootNode): Observable<LootItemNode[]> {
    if (!table) {
      return of([])
    }
    const items = context.accessLoottable(table)
    if (!items.length) {
      return of([])
    }

    const node = buildTableNode(table, parent)
    const streams$ = items.map((it): Observable<LootItemNode[]> => {
      if (it.ItemID) {
        return this.resolveItemId(it.ItemID, context, node)
      }
      if (it.LootBucketID) {
        return this.resolveBucketId(it.LootBucketID, context, node)
      }
      if (it.LootTableID) {
        return this.resolveTableId(it.LootTableID, context, node)
      }
      return of([])
    })

    return combineLatest(streams$).pipe(map((it) => it.flat(1)))
  }

  private resolveItemId(itemId: string, context: LootContext, parent: LootNode): Observable<LootItemNode[]> {
    if (context.bucketTags) {
      return of([])
    }
    return this.db
      .itemOrHousingItem(itemId)
      .pipe(map((item) => buildItemNode(item, parent)))
      .pipe(map((it) => (it ? [it] : [])))
  }

  private resolveBucketId(bucketId: string, context: LootContext, parent: LootNode): Observable<LootItemNode[]> {
    return this.buckets
      .bucket(bucketId)
      .filter((entry) => context.accessLootbucket(entry))
      .$.pipe(
        switchMap((entries) => {
          if (!entries.length) {
            return of([])
          }
          const items$ = entries.map((entry) => {
            const node = buildBucketNode(entry, parent)
            return this.db.itemOrHousingItem(entry.Item).pipe(map((item) => buildItemNode(item, node)))
          })
          return combineLatest(items$)
        })
      )
  }

  private resolveTableId(tableId: string, context: LootContext, parent: LootNode): Observable<LootItemNode[]> {
    return this.db.lootTable(tableId).pipe(switchMap((table) => this.resolve(table, context, parent)))
  }
}

function uniqItems(nodes: LootItemNode[]): LootItem[] {
  const items = nodes.map((it) => it.value)
  return uniqBy(items, (it) => getItemId(it))
}

function uniqItemNodes(nodes: LootItemNode[]): LootItemWithNodes[] {
  const groups = groupBy(nodes, (it) => getItemId(it.value))
  return Object.values(groups).map((group) => {
    return {
      item: group[0].value,
      nodes: group,
    }
  })
}

function buildItemNode(value: LootItem, parent: LootNode): LootItemNode {
  return {
    type: 'item',
    value: value,
    parent: parent,
    ref: getItemId(value)
  }
}

function buildBucketNode(value: LootBucketEntry, parent: LootNode): LootBucketNode {
  return {
    type: 'bucket',
    value: value,
    parent: parent,
    ref: value.LootBucket
  }
}

function buildTableNode(value: LootTableEntry, parent: LootNode): LootTableNode {
  return {
    type: 'table',
    value: value,
    parent: parent,
    ref: value.LootTableID
  }
}
