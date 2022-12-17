import { Injectable } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, map, Observable } from 'rxjs'
import { LootBucketEntry, LootBucketTag } from '../utils'
import { NwDbService } from '../nw-db.service'
import { uniq } from 'lodash'
import { LootBucketConditionNames, LootContext } from './nw-lootcontext'

export interface LootBucketQuery {
  $: Observable<LootBucketEntry[]>
  filter: (predicate: (entry: LootBucketEntry, i?: number) => boolean) => LootBucketQuery
  itemIds: () => Observable<Array<string>>
  items: () => Observable<Array<ItemDefinitionMaster | Housingitems>>
}

@Injectable({ providedIn: 'root' })
export class NwLootbucketService {
  public constructor(private db: NwDbService) {
    //
  }

  public all(): LootBucketQuery {
    return this.query(this.db.lootBuckets)
  }

  public bucket(id: string): LootBucketQuery {
    return this.query(this.db.lootBucket(id))
  }

  public context(options: {
    tags: string[],
    conditions: Partial<Record<LootBucketConditionNames, string | number>>
  }) {
    return new LootContext({
      tags: (options.tags || []),
      values: (options.conditions || {}),
    })
  }

  /**
   * Checks if entry has a specific tag
   */
  public matchTag(entry: LootBucketEntry, tag: string) {
    return entry.Tags.has(tag)
  }

  /**
   * Checks if entry has any given tag
   */
  public matchAnyTag(entry: LootBucketEntry, tags: string[]) {
    return tags.some((tag) => this.matchTag(entry, tag))
  }

  /**
   * Checks if entry has all of the given tags
   */
  public matchEveryTag(entry: LootBucketEntry, tags: string[]) {
    return tags.every((tag) => this.matchTag(entry, tag))
  }

  private query(q: Observable<LootBucketEntry[]>): LootBucketQuery {
    const filter = (predicate: (entry: LootBucketEntry) => boolean) => this.query(q.pipe(map((list) => list.filter(predicate))))
    return {
      $: q,
      filter: filter,
      itemIds: () => this.mapIds(q),
      items: () => this.mapItems(q),
    }
  }

  private mapIds(query$: Observable<LootBucketEntry[]>) {
    return query$.pipe(map((entries) => entries.map((it) => it.Item).filter((it) => !!it))).pipe(map(uniq))
  }

  private mapItems(query$: Observable<LootBucketEntry[]>) {
    return combineLatest({
      ids: this.mapIds(query$),
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
    }).pipe(
      map(({ ids, items, housing }) => {
        return ids.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it)
      })
    )
  }
}
