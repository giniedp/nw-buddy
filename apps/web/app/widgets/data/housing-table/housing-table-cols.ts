import {
  ItemRarity,
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityLabel,
  getItemRarityWeight,
  getItemTierAsRoman,
  getUIHousingCategoryLabel,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { Housingitems } from '@nw-data/generated'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { getIconFrameClass } from '~/ui/item-frame'
import { humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type HousingTableUtils = TableGridUtils<HousingTableRecord>
export type HousingTableRecord = Housingitems

export function housingColIcon(util: HousingTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: {
            href: util.tipLink('item', getItemId(data)),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: getItemIconPath(data) || NW_FALLBACK_ICON,
          rarity: getItemRarity(data),
        })
      )
    }),
  })
}

export function housingColName(util: HousingTableUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 300,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.Name)),
    getQuickFilterText: ({ value }) => value,
  })
}

export function housingColID(util: HousingTableUtils) {
  return util.colDef({
    colId: 'houseItemId',
    headerValueGetter: () => 'Item ID',
    field: util.fieldName('HouseItemID'),
    hide: true,
  })
}

export function housingColRarity(util: HousingTableUtils) {
  return util.colDef({
    colId: 'rarity',
    headerValueGetter: () => 'Rarity',
    valueGetter: ({ data }) => String(getItemRarity(data)),
    valueFormatter: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      comaparator: (a, b) => getItemRarityWeight(b.id as ItemRarity) - getItemRarityWeight(a.id as ItemRarity),
    }),
    width: 130,
    getQuickFilterText: ({ value }) => value,
    comparator: (a, b) => getItemRarityWeight(a) - getItemRarityWeight(b),
  })
}

export function housingColTier(util: HousingTableUtils) {
  return util.colDef({
    colId: 'tier',
    headerValueGetter: () => 'Tier',
    width: 80,
    filter: SelectFilter,
    valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
  })
}

export function housingColUserBookmark(util: HousingTableUtils) {
  return util.colDef({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(data.HouseItemID)?.mark || 0),
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (value: Housingitems) => getItemId(value),
      pref: util.itemPref,
    }),
  })
}

export function housingColUserStockValue(util: HousingTableUtils) {
  return util.colDef({
    colId: 'userStockValue',
    headerValueGetter: () => 'In Stock',
    headerTooltip: 'Number of items currently owned',
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(data.HouseItemID)?.stock),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: Housingitems) => getItemId(value),
      pref: util.itemPref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function housingColUserPrice(util: HousingTableUtils) {
  return util.colDef({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(data.HouseItemID)?.price),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: Housingitems) => getItemId(value),
      pref: util.itemPref,
      mode: 'price',
      // formatter: util.moneyFormatter, TODO:
    }),
    width: 100,
  })
}

export function housingColHousingTag1Placed(util: HousingTableUtils) {
  return util.colDef({
    colId: 'housingTag1Placed',
    headerValueGetter: () => 'Placement',
    headerName: 'Placement',
    valueGetter: util.fieldGetter('HousingTag1 Placed'),
    valueFormatter: ({ value }) => humanize(value),
    filter: SelectFilter,
    width: 150,
  })
}

export function housingColUiHousingCategory(util: HousingTableUtils) {
  return util.colDef({
    colId: 'uiHousingCategory',
    headerValueGetter: () => 'Housing Category',
    valueGetter: util.valueGetter(({ data }) => data.UIHousingCategory),
    valueFormatter: ({ value }) => util.i18n.get(getUIHousingCategoryLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getUIHousingCategoryLabel(value)),
    filter: SelectFilter,
    width: 150,
  })
}

export function housingColHowToObtain(util: HousingTableUtils) {
  return util.colDef({
    colId: 'howToObtain',
    headerValueGetter: () => 'Obtain',
    valueGetter: util.fieldGetter('HowToOptain (Primarily)'),
    valueFormatter: ({ value }) => humanize(value),
    filter: SelectFilter,
    width: 150,
  })
}

export function housingColHousingTags(util: HousingTableUtils) {
  return util.colDef({
    colId: 'housingTags',
    headerValueGetter: () => 'Housing Tags',
    width: 250,
    valueGetter: util.valueGetter(({ data }) => {
      return data.HousingTags
    }),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
