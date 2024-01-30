import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemPerkBucketIds, getItemPerks, getItemTypeLabel } from '@nw-data/common'
import { COLS_ITEMDEFINITIONMASTER, ItemDefinitionMaster } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDataService } from '~/data'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { DataTableCategory, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { ItemCellComponent } from './item-cell.component'
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
  itemColTransformFrom,
  itemColTransformTo,
} from './item-table-cols'

@Injectable()
export class ItemTableAdapter implements TableGridAdapter<ItemTableRecord>, DataViewAdapter<ItemTableRecord> {
  private db = inject(NwDataService)
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
      itemsMap: this.db.itemsMap,
      housingMap: this.db.housingItemsMap,
      perksMap: this.db.perksMap,
      transformsMap: this.db.itemTransformsMap,
      transformsMapReverse: this.db.itemTransformsByToItemIdMap,
    },
    ({ items, itemsMap, housingMap, perksMap, transformsMap, transformsMapReverse }) => {
      function getItem(id: string) {
        if (!id) {
          return null
        }
        return itemsMap.get(id) || housingMap.get(id) || { ItemID: id } as ItemDefinitionMaster
      }
      items = items.map((it): ItemTableRecord => {
        return {
          ...it,
          $perks: getItemPerks(it, perksMap),
          $perkBuckets: getItemPerkBucketIds(it),
          $transformTo: getItem(transformsMap.get(it.ItemID)?.ToItemId),
          $transformFrom: (transformsMapReverse.get(it.ItemID) || []).map((it) => getItem(it.FromItemId)),
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
    },
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
      itemColTransformTo(util),
      itemColTransformFrom(util),
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
