import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemPerkBucketIds, getItemPerks, getItemTypeLabel } from '@nw-data/common'
import { COLS_ITEMDEFINITIONMASTER } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { addGenericColumns } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'
import {
  ItemTableRecord,
  itemColBookmark,
  itemColEvent,
  itemColExpansion,
  itemColGearScore,
  itemColIcon,
  itemColItemClass,
  itemColItemId,
  itemColItemType,
  itemColItemTypeName,
  itemColName,
  itemColOwnedWithGS,
  itemColPerks,
  itemColPrice,
  itemColRarity,
  itemColSource,
  itemColStockCount,
  itemColTier,
  itemColTradingCategory,
  itemColTradingFamily,
  itemColTradingGroup,
} from './item-table-cols'
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemCellComponent } from './item-cell.component'

@Injectable()
export class ItemTableAdapter implements TableGridAdapter<ItemTableRecord>, DataViewAdapter<ItemTableRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<ItemTableRecord> = inject(TableGridUtils)

  public entityID(item: ItemTableRecord): string {
    return item.ItemID
  }

  public entityCategories(item: ItemTableRecord): DataTableCategory[] {
    if (!item.ItemType) {
      return null
    }
    return [
      {
        id: item.ItemType,
        label: this.i18n.get(getItemTypeLabel(item.ItemType)) || item.ItemType,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<ItemTableRecord> {
    return ItemCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<ItemTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonItemGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(
    {
      items: this.config?.source || this.db.items,
      perks: this.db.perksMap,
    },
    ({ items, perks }) => {
      items = items.map((it): ItemTableRecord => {
        return {
          ...it,
          $perks: getItemPerks(it, perks),
          $perkBuckets: getItemPerkBucketIds(it),
        }
      })
      const filter = this.config?.filter
      if (filter) {
        items = items.filter(filter)
      }
      const sort = this.config?.sort
      if (sort) {
        items = [...items].sort(sort)
      }
      return items
    }
  )
}

export function buildCommonItemGridOptions(util: TableGridUtils<ItemTableRecord>) {
  const result: GridOptions<ItemTableRecord> = {
    columnDefs: [
      itemColIcon(util),
      itemColName(util),
      // colDefPin(util),
      itemColItemId(util),
      itemColPerks(util),
      itemColRarity(util),
      itemColTier(util),
      itemColItemTypeName(util),
      itemColBookmark(util),
      itemColStockCount(util),
      itemColOwnedWithGS(util),
      itemColPrice(util),
      itemColGearScore(util),
      itemColSource(util),
      itemColEvent(util),
      itemColExpansion(util),
      itemColItemType(util),
      itemColItemClass(util),
      itemColTradingGroup(util),
      itemColTradingFamily(util),
      itemColTradingCategory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_ITEMDEFINITIONMASTER,
  })
  return result
}

export function buildPickerItemGridOptions(util: TableGridUtils<ItemTableRecord>) {
  const result: GridOptions<ItemTableRecord> = {
    columnDefs: [
      itemColIcon(util),
      itemColName(util),
      // colDefPin(util),
      itemColItemId(util),
      itemColPerks(util),
      itemColRarity(util),
      itemColTier(util),
      itemColItemTypeName(util),
      itemColBookmark(util),
      itemColGearScore(util),
      itemColSource(util),
      itemColEvent(util),
      itemColExpansion(util),
      itemColItemType(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_ITEMDEFINITIONMASTER,
  })
  return result
}
