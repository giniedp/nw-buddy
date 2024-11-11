import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  PvpStoreTableRecord,
  pvpStoreColBudgetContribution,
  pvpStoreColColumn,
  pvpStoreColEntitlement,
  pvpStoreColExcludeType,
  pvpStoreColGameEvent,
  pvpStoreColIcon,
  pvpStoreColItem,
  pvpStoreColMatchOne,
  pvpStoreColName,
  pvpStoreColRandomWeights,
  pvpStoreColRewardId,
  pvpStoreColRewardName,
  pvpStoreColTags,
  pvpStoreSelectOnceOnly,
  pvpStoreType,
} from './pvp-store-table-cols'

@Injectable()
export class PvpStoreTableAdapter implements DataViewAdapter<PvpStoreTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<PvpStoreTableRecord>({ optional: true })
  private utils: TableGridUtils<PvpStoreTableRecord> = inject(TableGridUtils)

  public entityID(item: PvpStoreTableRecord): string {
    return `${item.Bucket}_${item.Row}` //.toLowerCase()
  }

  public entityCategories(item: PvpStoreTableRecord): DataTableCategory[] {
    return null
  }
  public virtualOptions(): VirtualGridOptions<PvpStoreTableRecord> {
    return null
  }
  public gridOptions(): GridOptions<PvpStoreTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return combineLatest({
      items: this.db.itemsByIdMap(),
      housing: this.db.housingItemsByIdMap(),
      rows: this.db.pvpStoreBucketsAll(),
      rewardsMap: this.db.pvpRewardsByIdMap(),
      gameEventsMap: this.db.gameEventsByIdMap(),
    }).pipe(
      map(({ items, housing, rows, rewardsMap, gameEventsMap }) => {
        return rows.map((it): PvpStoreTableRecord => {
          const reward = rewardsMap.get(it.RewardId)
          const itemId = it.Item || reward?.Item
          return {
            ...it,
            $item: items.get(itemId) || housing.get(itemId),
            $reward: rewardsMap.get(it.RewardId),
            $gameEvent: gameEventsMap.get(reward?.GameEvent),
          }
        })
      }),
    )
  }
}

function buildOptions(util: TableGridUtils<PvpStoreTableRecord>) {
  const result: GridOptions<PvpStoreTableRecord> = {
    columnDefs: [
      pvpStoreColIcon(util),
      pvpStoreColName(util),
      pvpStoreColColumn(util),
      pvpStoreColItem(util),
      pvpStoreColRewardId(util),
      pvpStoreColRewardName(util),
      pvpStoreColTags(util),

      pvpStoreType(util),
      pvpStoreColExcludeType(util),
      pvpStoreColMatchOne(util),
      pvpStoreSelectOnceOnly(util),

      pvpStoreColGameEvent(util),
      pvpStoreColRandomWeights(util),
      pvpStoreColEntitlement(util),
      pvpStoreColBudgetContribution(util),
    ],
  }

  return result
}
