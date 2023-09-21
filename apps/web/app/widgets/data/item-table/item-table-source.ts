import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemPerkBucketIds, getItemPerks, getItemTypeLabel } from '@nw-data/common'
import { COLS_ITEMDEFINITIONMASTER } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { DATA_TABLE_SOURCE_OPTIONS, DataTableSource, DataTableUtils } from '~/ui/data-grid'

import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import { selectStream } from '~/utils'
import {
  ItemTableRecord,
  itemColBookmark,
  itemColEvent,
  itemColGearScore,
  itemColIcon,
  itemColItemClass,
  itemColItemId,
  itemColItemType,
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

@Injectable()
export class ItemTableSource extends DataTableSource<ItemTableRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<ItemTableRecord> = inject(DataTableUtils)

  public override entityID(item: ItemTableRecord): string {
    return item.ItemID
  }

  public override entityCategories(item: ItemTableRecord): DataTableCategory[] {
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

  public override gridOptions(): GridOptions<ItemTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonItemGridOptions(this.utils)
  }

  public connect() {
    return selectStream(
      {
        items: this.config?.source || this.db.items,
        perks: this.db.perksMap,
      },
      ({ items, perks }) => {
        return items.map((it): ItemTableRecord => {
          return {
            ...it,
            $perks: getItemPerks(it, perks),
            $perkBuckets: getItemPerkBucketIds(it),
          }
        })
      }
    )
  }
}

export function buildCommonItemGridOptions(util: DataTableUtils<ItemTableRecord>) {
  const result: GridOptions<ItemTableRecord> = {
    columnDefs: [
      itemColIcon(util),
      itemColName(util),
      // colDefPin(util),
      itemColItemId(util),
      itemColPerks(util),
      itemColRarity(util),
      itemColTier(util),
      itemColBookmark(util),
      itemColStockCount(util),
      itemColOwnedWithGS(util),
      itemColPrice(util),
      itemColGearScore(util),
      itemColSource(util),
      itemColEvent(util),
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

export function buildPickerItemGridOptions(util: DataTableUtils<ItemTableRecord>) {
  const result: GridOptions<ItemTableRecord> = {
    columnDefs: [
      itemColIcon(util),
      itemColName(util),
      // colDefPin(util),
      itemColItemId(util),
      itemColPerks(util),
      itemColRarity(util),
      itemColTier(util),
      itemColBookmark(util),
      itemColGearScore(util),
      itemColSource(util),
      itemColEvent(util),
      itemColItemType(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_ITEMDEFINITIONMASTER,
  })
  return result
}
