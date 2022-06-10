import { Injectable } from "@angular/core"
import { Housingitems, ItemDefinitionMaster } from "@nw-data/types"
import { combineLatest, defer, map, Observable } from "rxjs"
import { shareReplayRefCount } from "../utils"
import { convertLootbuckets, LootBucketEntry } from "./utils"
import { NwDbService } from "./nw-db.service"

export interface LootBucketQuery {
  $: Observable<LootBucketEntry[]>
  filter: (tags: string[]) => LootBucketQuery
  exclude: (tags: string[]) => LootBucketQuery
  itemIds: () => Observable<Array<string>>
  items: () => Observable<Array<ItemDefinitionMaster | Housingitems>>
}

@Injectable({ providedIn: 'root' })
export class LootbucketService {

  public bucket$ = defer(() => this.db.data.lootbuckets())
    .pipe(map((data) => convertLootbuckets(data)))
    .pipe(shareReplayRefCount(1))

  public entrie$ = defer(() => this.bucket$)
    .pipe(map((table) => {
      return table.map((it) => it.Entries).flat(1)
    }))
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService) {

  }

  public bucket(id: string): LootBucketQuery {
    const query = (q: Observable<LootBucketEntry[]>) => {
      return {
        $: q,
        filter: (tags: string[]) => query(q.pipe(map((list) => filterEntries(list, tags)))),
        exclude: (tags: string[]) => query(q.pipe(map((list) => excludeEntries(list, tags)))),
        itemIds: () => this.mapIds(q),
        items: () => this.mapItems(q)
      }
    }
    return query(this.bucket$.pipe(map((rows) => {
      const index = rows[0].Entries.findIndex((it) => it.LootBucket === id)
      if (index >= 0) {
        return rows.map((it) => it.Entries[index]).filter((it) => !!it && !!it.Item)
      }
      return []
    })))
  }

  public all(): LootBucketQuery {
    const query = (q: Observable<LootBucketEntry[]>) => {
      return {
        $: q,
        filter: (tags: string[]) => query(q.pipe(map((list) => filterEntries(list, tags)))),
        exclude: (tags: string[]) => query(q.pipe(map((list) => excludeEntries(list, tags)))),
        itemIds: () => this.mapIds(q),
        items: () => this.mapItems(q)
      }
    }
    return query(this.entrie$)
  }

  public filtered(query$: Observable<LootBucketEntry[]>, tags: string[]) {
    return query$.pipe(map((list) => filterEntries(list, tags)))
  }

  public mapIds(quer$: Observable<LootBucketEntry[]>) {
    return quer$.pipe(map((entries) => {
      return entries.map((it) => it.Item).filter((it) => !!it)
    }))
    .pipe(map((list) => Array.from(new Set(list)) ))
  }

  public mapItems(quer$: Observable<LootBucketEntry[]>) {
    return combineLatest({
      ids: this.mapIds(quer$),
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap
    })
    .pipe(map(({
      ids, items, housing
    }) => {
      return ids.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it)
    }))
  }
}

function filterEntries(entries: LootBucketEntry[], tags: string[]) {
  // TODO: case insensitive?
  return entries.filter((it) => it.Tags?.some((tag) => tags.includes(tag?.Name)))
}

function excludeEntries(entries: LootBucketEntry[], tags: string[]) {
  // TODO: case insensitive?
  return entries.filter((it) => it.Tags?.every((tag) => !tags.includes(tag?.Name)))
}
