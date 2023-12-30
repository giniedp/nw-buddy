import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewAdapter } from '~/ui/data/data-view'
import { DataTableCategory, TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
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
  pvpStoreColTags,
  pvpStoreSelectOnceOnly,
  pvpStoreType,
} from './pvp-store-table-cols'

@Injectable()
export class PvpStoreTableAdapter
  implements DataViewAdapter<PvpStoreTableRecord>, TableGridAdapter<PvpStoreTableRecord>
{
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<PvpStoreTableRecord> = inject(TableGridUtils)

  public entityID(item: PvpStoreTableRecord): string {
    return `${item.Bucket}_${item.Row}`
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
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      rows: this.db.pvpStoreBuckets,
    }).pipe(
      map(({ items, housing, rows }) => {
        return rows.map((it): PvpStoreTableRecord => {
          return {
            ...it,
            $item: items.get(it.Item) || housing.get(it.Item),
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
