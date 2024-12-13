import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { getItemId, LootBucketRow } from '@nw-data/common'
import { GameEventData, HouseItems, LootLimitData, MasterItemDefinitions } from '@nw-data/generated'
import { NwDataSheets } from 'libs/nw-data/db/nw-data-sheets'
import { uniq } from 'lodash'
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { combineLatestOrEmpty, rejectKeys } from '~/utils'

export interface LootLimitDetailState {
  limitId: string
  lootLimit: LootLimitData
  item: MasterItemDefinitions | HouseItems
  buckets: LootBucketRow[]
  lootTablesIds: string[]
  eventsWithLimit: GameEventData[]
  eventsAfterLimit: GameEventData[]
}
export const LootLimitDetailStore = signalStore(
  withState<LootLimitDetailState>({
    limitId: null,
    lootLimit: null,
    item: null,
    buckets: [],
    lootTablesIds: [],
    eventsWithLimit: [],
    eventsAfterLimit: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (id: string): Observable<LootLimitDetailState> => loadState(db, id),
    }
  }),
  withComputed(({ lootLimit }) => {
    return {
      limitCount: computed(() => lootLimit()?.CountLimit),
      cooldown: computed(() => secondsToDuration(lootLimit()?.LimitExpireSeconds)),
      props: computed(() => selectProperties(lootLimit())),
    }
  }),
)

function loadState(db: NwDataSheets, id: string): Observable<LootLimitDetailState> {
  return combineLatest({
    limitId: of(id),
    lootLimit: from(db.lootLimitsById(id)),
    item: from(db.itemOrHousingItem(id)),
    buckets: from(db.lootBucketsByItemId(id)),
  }).pipe(
    switchMap((data) => {
      return loadLootTableIds(db, { itemId: getItemId(data.item), limitId: data.limitId, buckets: data.buckets }).pipe(
        map((list) => {
          return {
            ...data,
            lootTablesIds: list,
          }
        }),
      )
    }),
    switchMap((data) => {
      return from(db.gameEventsByLootLimitId(data.limitId)).pipe(
        map((eventsWithLimit) => {
          return {
            ...data,
            eventsWithLimit,
          }
        }),
      )
    }),
    switchMap((data) => {
      return loadGameEventsAfterLimit(db, data.eventsWithLimit).pipe(
        map((eventsAfterLimit) => {
          return {
            ...data,
            eventsAfterLimit,
          }
        }),
      )
    }),
  )
}

function loadLootTableIds(db: NwDataSheets, options: { itemId: string; limitId: string; buckets: LootBucketRow[] }) {
  return from(db.lootTablesAll()).pipe(
    map((lootTables) => {
      const itemId = options.itemId
      const limitId = options.limitId
      const bucketIds = options.buckets?.map((it) => it.LootBucket)
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
      return uniq(result)
    }),
  )
}

function loadGameEventsAfterLimit(db: NwDataSheets, events: GameEventData[]): Observable<GameEventData[]> {
  events ||= []
  const eventIds = events.map((it) => it.LootLimitReachedGameEventId).filter((it) => !!it)
  return combineLatestOrEmpty(eventIds.map((it) => db.gameEventsById(it)))
}

function selectProperties(item: LootLimitData) {
  return rejectKeys(item, (key) => !item[key] || key.startsWith('$'))
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
