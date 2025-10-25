import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import {
  NW_FALLBACK_ICON,
  PerkBucket,
  getItemId,
  getItemPerkBucketIds,
  getItemPerks,
  getPerkBucketPerkIDs,
  isPerkCharm,
  isPerkGem,
  isPerkInfix,
} from '@nw-data/common'
import {
  COLS_CONSUMABLEITEMDEFINITIONS,
  COLS_MASTERITEMDEFINITIONS,
  MasterItemDefinitions,
  PerkData,
} from '@nw-data/generated'
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
  itemColPerkOptions,
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
        bucketsMap: this.db.perkBucketsByIdMap(),
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
      bucketsMap,
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
        const perkStats = getItemPerkStats(it, perksMap, bucketsMap)
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
          $perks: perkStats.perks,
          $affixes: perkStats.perks
            .map((perk) => {
              return perk?.Affix?.map((id) => affixMap.get(id)) || []
            })
            .flat()
            .filter((it) => !!it),
          $gemable: perkStats.canHaveGem,
          $infixable: perkStats.canHaveInfix,
          $slotable: perkStats.charmSlots,
          $perkBuckets: perkStats.bucketIds,
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
      itemColPerkOptions(util),
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
      itemColPerkOptions(util),
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

function getItemPerkStats(
  item: MasterItemDefinitions,
  perksMap: Map<string, PerkData>,
  bucketsMap: Map<string, PerkBucket>,
) {
  const perks = getItemPerks(item, perksMap)
  const bucketIds = getItemPerkBucketIds(item)
  let canHaveInfix = false
  let canHaveGem = false
  let charmSlots = 0

  for (const perk of perks) {
    if (isPerkGem(perk)) {
      canHaveGem = true
      continue
    }
    if (isPerkCharm(perk)) {
      charmSlots += 1
      continue
    }
    if (isPerkInfix(perk)) {
      canHaveInfix = true
      continue
    }
  }
  for (const bucketId of bucketIds) {
    const bucket = bucketsMap.get(bucketId)
    let bucketIsCharm = false
    for (const perkId of getPerkBucketPerkIDs(bucket)) {
      const perk = perksMap.get(perkId)
      if (isPerkGem(perk)) {
        canHaveGem = true
        continue
      }
      if (isPerkCharm(perk)) {
        bucketIsCharm = true
        continue
      }
      if (isPerkInfix(perk)) {
        canHaveInfix = true
        continue
      }
    }
    if (bucketIsCharm) {
      charmSlots += 1
    }
  }
  return {
    perks,
    bucketIds,
    canHaveInfix,
    canHaveGem,
    charmSlots,
  }
}
