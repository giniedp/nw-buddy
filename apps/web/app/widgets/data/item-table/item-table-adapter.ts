import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getItemId, getItemPerkBucketIds, getItemPerks, getItemTypeLabel } from '@nw-data/common'
import { COLS_CONSUMABLEITEMDEFINITIONS, COLS_MASTERITEMDEFINITIONS, MasterItemDefinitions } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { TableGridUtils } from '~/ui/data/table-grid'

import { uniq } from 'lodash'
import { combineLatest, defer } from 'rxjs'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { ItemCellComponent } from './item-cell.component'
import {
  ItemTableRecord,
  ShopInfo,
  itemColAttributeMods,
  itemColBookmark,
  itemColEquipmentSetId,
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
  itemColPerkValidity,
  itemColPerks,
  itemColPrice,
  itemColRarity,
  itemColShops,
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
export class ItemTableAdapter implements DataViewAdapter<ItemTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<ItemTableRecord>({ optional: true })
  private utils: TableGridUtils<ItemTableRecord> = inject(TableGridUtils)

  public entityID(item: ItemTableRecord): string {
    return item.ItemID.toLowerCase()
  }

  public entityCategories(item: ItemTableRecord): DataTableCategory[] {
    if (!item.ItemTypeDisplayName) {
      return null
    }
    return [
      {
        id: item.ItemTypeDisplayName.toLowerCase(),
        label: this.i18n.get(item.ItemTypeDisplayName) || item.ItemTypeDisplayName,
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
    defer(() =>
      combineLatest({
        items: this.config?.source || this.db.itemsAll(),
        itemsMap: this.db.itemsByIdMap(),
        housingMap: this.db.housingItemsByIdMap(),
        perksMap: this.db.perksByIdMap(),
        affixMap: this.db.affixStatsByIdMap(),
        transformsMap: this.db.itemTransformsByIdMap(),
        transformsMapReverse: this.db.itemTransformsByToItemIdMap(),
        conversionMap: this.db.itemCurrencyConversionByItemIdMap(),
        progressionMap: this.db.categoricalProgressionByIdMap(),
        shopMap: this.db.shopDataByProgressionIdMap(),
        consumablesMap: this.db.consumableItemsByIdMap(),
        equipmentSetsMap: this.db.equipmentSetsByIdMap(),
      }),
    ),
    ({
      items,
      itemsMap,
      housingMap,
      perksMap,
      affixMap,
      transformsMap,
      transformsMapReverse,
      conversionMap,
      progressionMap,
      shopMap,
      consumablesMap,
      equipmentSetsMap,
    }) => {
      function getItem(id: string) {
        if (!id) {
          return null
        }
        return itemsMap.get(id) || housingMap.get(id) || ({ ItemID: id } as MasterItemDefinitions)
      }
      items = items.map((it: ItemTableRecord): ItemTableRecord => {
        const perks = getItemPerks(it, perksMap)
        const equipmentSet = equipmentSetsMap.get(it.EquipmentSetId)
        const conversions = conversionMap.get(getItemId(it)) || []
        const shops = uniq(conversions.map((it) => it.CategoricalProgressionId))
          .map((id): ShopInfo => {
            const shop = shopMap.get(id)
            const prog = progressionMap.get(id as any)
            return {
              ProgressionId: id,
              Icon: shop?.ShopIconSmall || prog?.IconPath || NW_FALLBACK_ICON,
              Label: shop?.ShopName || prog?.DisplayName,
            }
          })
          .filter((it) => !!it)
        return {
          ...it,
          $perks: perks,
          $affixes: perks
            .map((perk) => {
              return perk?.Affix?.map((id) => affixMap.get(id)) || []
            })
            .flat()
            .filter((it) => !!it),
          $perkBuckets: getItemPerkBucketIds(it),
          $transformTo: getItem(transformsMap.get(it.ItemID)?.ToItemId),
          $transformFrom: (transformsMapReverse.get(it.ItemID) || []).map((it) => getItem(it.FromItemId)),
          $consumable: consumablesMap.get(it.ItemID),
          $conversions: conversions,
          $shops: shops,
          $equipmentSet: equipmentSet,
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
      itemColPerkValidity(util),
      itemColEquipmentSetId(util),
      itemColAttributeMods(util),
      itemColRarity(util),
      itemColTier(util),
      itemColItemTypeName(util),
      itemColBookmark(util),
      itemColStockCount(util),
      itemColOwnedWithGS(util),
      itemColPrice(util),
      itemColGearScore(util),
      itemColSource(util),
      itemColShops(util),
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
    props: COLS_MASTERITEMDEFINITIONS,
  })
  addGenericColumns(result, {
    props: COLS_CONSUMABLEITEMDEFINITIONS,
    scope: '$consumable',
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
      itemColAttributeMods(util),
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
    props: COLS_MASTERITEMDEFINITIONS,
  })
  return result
}
