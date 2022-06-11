import { Injectable } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, map, Observable } from 'rxjs'
import { LootBucketEntry, LootBucketTag } from './utils'
import { NwDbService } from './nw-db.service'
import { uniq } from 'lodash'

export interface LootBucketQuery {
  $: Observable<LootBucketEntry[]>
  filter: (predicate: (entry: LootBucketEntry) => boolean) => LootBucketQuery
  itemIds: () => Observable<Array<string>>
  items: () => Observable<Array<ItemDefinitionMaster | Housingitems>>
}

export type ContextTagName = 'Level' | 'MinContLevel'

export interface ContextTag {
  Name: ContextTagName
  Value: string | number
}

@Injectable({ providedIn: 'root' })
export class NwLootbucketService {
  public constructor(private db: NwDbService) {}

  public hasAnyTag(entry: LootBucketEntry, tags: string[]) {
    return tags.some((tag) => entry.Tags.has(tag))
  }

  public all(): LootBucketQuery {
    return this.query(this.db.lootBuckets)
  }

  public bucket(id: string): LootBucketQuery {
    return this.query(this.db.lootBucket(id))
  }

  public contextTag(name: ContextTagName, value: string | number): ContextTag {
    return {
      Name: name,
      Value: value,
    }
  }

  public matchContext(entry: LootBucketEntry, context: Array<string | ContextTag>): boolean {
    const stringTags = context.filter((it) => typeof it === 'string') as string[]
    const conditionTags = context.filter((it) => typeof it !== 'string') as ContextTag[]
    const entryTags = Array.from(entry.Tags.values())
    let result = true
    for (const tag of entryTags) {
      if (stringTags.find((it) => tagNameMatch(it, tag.Name))) {
        continue
      }
      const condition = conditionTags.find((it) => tagNameMatch(it.Name, tag.Name))
      if (condition && isInRange(tag, condition.Value)) {
        continue
      }
      result = false
      break
    }
    return result
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

  private mapIds(quer$: Observable<LootBucketEntry[]>) {
    return quer$.pipe(map((entries) => entries.map((it) => it.Item).filter((it) => !!it))).pipe(map(uniq))
  }

  private mapItems(quer$: Observable<LootBucketEntry[]>) {
    return combineLatest({
      ids: this.mapIds(quer$),
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
    }).pipe(
      map(({ ids, items, housing }) => {
        return ids.map((id) => items.get(id) || housing.get(id)).filter((it) => !!it)
      })
    )
  }
}



function tagNameMatch(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}
function isInRange(tag: LootBucketTag, value: string | number) {
  switch (tag?.Value?.length) {
    case 1: {
      return tag.Value[0] <= Number(value)
    }
    case 2: {
      return tag.Value[0] <= Number(value) && Number(value) <= tag.Value[1]
    }
    default: {
      return false
    }
  }
}
