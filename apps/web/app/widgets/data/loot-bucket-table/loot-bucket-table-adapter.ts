import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
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
export class LootBucketTableAdapter implements DataViewAdapter<LootBucketTableRecord> {
  private db = inject(NwDataService)
  private config = injectDataViewAdapterOptions<LootBucketTableRecord>({ optional: true })
  private utils: TableGridUtils<LootBucketTableRecord> = inject(TableGridUtils)

  public entityID(item: LootBucketTableRecord): string {
    return `${item.LootBucket}-${item.Row}`.toLowerCase()
  }

  public entityCategories(item: LootBucketTableRecord): DataTableCategory[] {
    if (!item.$source) {
      return null
    }
    const source = item.$source.replace('LootBuckets', '') || 'Common'
    return [
      {
        id: source.toLowerCase(),
        label: humanize(source),
      },
    ]
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
        return rows
          .map((it): LootBucketTableRecord => {
            return {
              ...it,
              $item: items.get(it.Item) || housing.get(it.Item),
            }
          })
          .sort((a, b) => this.entityID(a).localeCompare(this.entityID(b)))
      }),
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
