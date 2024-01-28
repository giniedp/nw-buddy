import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { getItemId } from '@nw-data/common'
import { Lootlimits } from '@nw-data/generated'
import { uniq } from 'lodash'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { eqCaseInsensitive, mapList, rejectKeys, selectStream, switchMapCombineLatest } from '~/utils'

@Injectable()
export class LootLimitDetailStore extends ComponentStore<{ limitId: string }> {
  protected db = inject(NwDataService)

  public readonly limitId$ = this.select(({ limitId }) => limitId)
  public readonly lootLimit$ = selectStream(this.db.lootLimit(this.limitId$))
  public readonly limitCount$ = this.select(this.lootLimit$, (it) => it?.CountLimit)
  public readonly cooldown$ = this.select(this.lootLimit$, (it) => secondsToDuration(it?.LimitExpireSeconds))
  public readonly props$ = this.select(this.lootLimit$, selectProperties)

  public readonly item$ = selectStream(this.db.itemOrHousingItem(this.limitId$))

  public readonly buckets$ = this.select(this.limitId$, this.db.lootBuckets, (itemId, buckets) => {
    const result = buckets?.filter((it) => eqCaseInsensitive(it.Item, itemId))
    return result?.length ? result : null
  })

  public readonly lootTables$ = selectStream(
    {
      limitId: this.limitId$,
      itemId: this.item$.pipe(map(getItemId)),
      lootTables: this.db.lootTables,
      bucketIds: this.buckets$.pipe(
        mapList((it) => it.LootBucket),
        map((it) => uniq(it || [])),
      ),
    },
    ({ limitId, itemId, lootTables, bucketIds }) => {
      lootTables = lootTables || []

      bucketIds = bucketIds || []
      let result: string[] = []
      for (const table of lootTables) {
        for (const item of table.Items) {
          if (limitId && item.LootLimitID === limitId) {
            result.push(table.LootTableID)
          } else if (itemId && item.ItemID === itemId) {
            result.push(table.LootTableID)
          } else if (item.LootBucketID && bucketIds?.includes(item.LootBucketID)) {
            result.push(table.LootTableID)
          }
        }
      }
      result = uniq(result)
      return result.length ? result : null
    },
  )

  public readonly eventsWithLimit$ = selectStream(this.db.gameEventsByLootLimitId(this.limitId$), (list) =>
    list?.length ? list : null,
  )
  public readonly eventsAfterLimit$ = selectStream(
    this.eventsWithLimit$.pipe(
      mapList((it) => it.LootLimitReachedGameEventId),
      map((list) => list?.filter((it) => !!it) || []),
      switchMapCombineLatest((it) => this.db.gameEvent(it)),
    ),
    (list) => (list?.length ? list : null),
  )

  public constructor() {
    super({ limitId: null })
  }

  public load(idOrItem: string | Lootlimits) {
    if (typeof idOrItem === 'string') {
      this.patchState({ limitId: idOrItem })
    } else {
      this.patchState({ limitId: idOrItem?.LootLimitID })
    }
  }
}

function selectProperties(item: Lootlimits) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function secondsToDuration(value: number) {
  if (value == null) {
    return null
  }
  const milliseconds = Math.floor(value * 1000) % 1000
  const seconds = Math.floor(value % 60)
  const minutes = Math.floor(value / 60) % 60
  const hours = Math.floor(value / 3600) % 24
  const days = Math.floor(value / 86400)
  const result = []
  if (milliseconds) {
    result.push(`${milliseconds}ms`)
  }
  if (seconds) {
    result.push(`${seconds}s`)
  }
  if (minutes) {
    result.push(`${minutes}m`)
  }
  if (hours) {
    result.push(`${hours}h`)
  }
  if (days) {
    result.push(`${days}d`)
  }
  return result.reverse().join(' ')
}
