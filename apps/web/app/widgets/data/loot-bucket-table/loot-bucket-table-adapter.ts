import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewAdapter } from '~/ui/data/data-view'
import { DataTableCategory, TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  LootBucketTableRecord,
  lootBucketColColumn,
  lootBucketColIcon,
  lootBucketColItem,
  lootBucketColMatchOne,
  lootBucketColName,
  lootBucketColQuantity,
  lootBucketColTags,
} from './loot-bucket-table-cols'

@Injectable()
export class LootBucketTableAdapter
  implements DataViewAdapter<LootBucketTableRecord>, TableGridAdapter<LootBucketTableRecord>
{
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<LootBucketTableRecord> = inject(TableGridUtils)

  public entityID(item: LootBucketTableRecord): string {
    return `${item.LootBucket}_${item.Row}`
  }

  public entityCategories(item: LootBucketTableRecord): DataTableCategory[] {
    return null
  }
  public virtualOptions(): VirtualGridOptions<LootBucketTableRecord> {
    return null
  }
  public gridOptions(): GridOptions<LootBucketTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      rows: this.db.lootBuckets,
    }).pipe(
      map(({ items, housing, rows }) => {
        return rows.map((it): LootBucketTableRecord => {
          return {
            ...it,
            $item: items.get(it.Item) || housing.get(it.Item),
          }
        })
      })
    )
  }
}

function buildOptions(util: TableGridUtils<LootBucketTableRecord>) {
  const result: GridOptions<LootBucketTableRecord> = {
    columnDefs: [
      lootBucketColIcon(util),
      lootBucketColName(util),
      lootBucketColColumn(util),
      lootBucketColItem(util),
      lootBucketColQuantity(util),
      lootBucketColMatchOne(util),
      lootBucketColTags(util),
    ],
  }
  // addGenericColumns(result, {
  //   props: COLS_LOOTLIMITS,
  // })
  return result
}
