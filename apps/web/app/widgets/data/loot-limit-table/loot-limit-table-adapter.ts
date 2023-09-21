import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTLIMITS } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  LootLimitTableRecord,
  lootLimitColCountLimit,
  lootLimitColIcon,
  lootLimitColLimitExpiresAfter,
  lootLimitColName,
  lootLimitColTimeBetweenDrops,
} from './loot-limit-table-cols'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'

@Injectable()
export class LootLimitTableAdapter
  implements DataViewAdapter<LootLimitTableRecord>, DataGridAdapter<LootLimitTableRecord>
{
  private db = inject(NwDbService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<LootLimitTableRecord> = inject(DataTableUtils)

  public entityID(item: LootLimitTableRecord): string {
    return item.LootLimitID
  }

  public entityCategories(item: LootLimitTableRecord): DataTableCategory[] {
    return null
  }
  public virtualOptions(): VirtualGridOptions<LootLimitTableRecord> {
    return null
  }
  public gridOptions(): GridOptions<LootLimitTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      limits: this.db.lootLimits,
    }).pipe(
      map(({ items, housing, limits }) => {
        return limits.map((it): LootLimitTableRecord => {
          return {
            ...it,
            $item: items.get(it.LootLimitID) || housing.get(it.LootLimitID),
          }
        })
      })
    )
  }
}

function buildOptions(util: DataTableUtils<LootLimitTableRecord>) {
  const result: GridOptions<LootLimitTableRecord> = {
    columnDefs: [
      lootLimitColIcon(util),
      lootLimitColName(util),
      lootLimitColCountLimit(util),
      lootLimitColTimeBetweenDrops(util),
      lootLimitColLimitExpiresAfter(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_LOOTLIMITS,
  })
  return result
}
