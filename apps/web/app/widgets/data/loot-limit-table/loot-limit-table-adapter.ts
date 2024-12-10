import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTLIMITDATA } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  LootLimitTableRecord,
  lootLimitColCountLimit,
  lootLimitColIcon,
  lootLimitColLimitExpiresAfter,
  lootLimitColName,
  lootLimitColTimeBetweenDrops,
} from './loot-limit-table-cols'

@Injectable()
export class LootLimitTableAdapter implements DataViewAdapter<LootLimitTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<LootLimitTableRecord>({ optional: true })
  private utils: TableGridUtils<LootLimitTableRecord> = inject(TableGridUtils)

  public entityID(item: LootLimitTableRecord): string {
    return item.LootLimitID.toLowerCase()
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
      items: this.db.itemsByIdMap(),
      housing: this.db.housingItemsByIdMap(),
      limits: this.db.lootLimitsAll(),
    }).pipe(
      map(({ items, housing, limits }) => {
        return limits.map((it): LootLimitTableRecord => {
          return {
            ...it,
            $item: items.get(it.LootLimitID) || housing.get(it.LootLimitID),
          }
        })
      }),
    )
  }
}

function buildOptions(util: TableGridUtils<LootLimitTableRecord>) {
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
    props: COLS_LOOTLIMITDATA,
  })
  return result
}
