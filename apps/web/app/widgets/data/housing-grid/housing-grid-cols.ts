import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  getUIHousingCategoryLabel,
} from '@nw-data/common'
import { Housingitems } from '@nw-data/generated'
import { SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { getIconFrameClass } from '~/ui/item-frame'
import { humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type HousingGridUtils = DataGridUtils<HousingGridRecord>
export type HousingGridRecord = Housingitems

export function housingColIcon(util: HousingGridUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: {
            href: util.nwLink.link('item', getItemId(data)),
            target: '_blank',
          },
        },
        util.elPicture(
          {
            class: [...getIconFrameClass(data, true), 'transition-all translate-x-0 hover:translate-x-1'],
          },
          [
            util.el('span', { class: 'nw-item-icon-border' }),
            util.elImg({
              src: getItemIconPath(data) || NW_FALLBACK_ICON,
            }),
          ]
        )
      )
    }),
  })
}

export function housingColName(util: HousingGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 300,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.Name)),
    getQuickFilterText: ({ value }) => value,
  })
}

export function housingColHouseItemId(util: HousingGridUtils) {
  return util.colDef({
    colId: 'houseItemId',
    headerValueGetter: () => 'Item ID',
    field: util.fieldName('HouseItemID'),
    hide: true,
  })
}

export function housingColRarity(util: HousingGridUtils) {
  return util.colDef({
    colId: 'rarity',
    headerValueGetter: () => 'Rarity',
    valueGetter: ({ data }) => String(getItemRarity(data)),
    valueFormatter: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    filter: SelectFilter,
    width: 130,
    getQuickFilterText: ({ value }) => value,
  })
}

export function housingColTier(util: HousingGridUtils) {
  return util.colDef({
    colId: 'tier',
    headerValueGetter: () => 'Tier',
    width: 80,
    field: util.fieldName('Tier'),
    filter: SelectFilter,
    valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
  })
}

export function housingColUserBookmark(util: HousingGridUtils) {
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

export function housingColUserStockValue(util: HousingGridUtils) {
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

export function housingColUserPrice(util: HousingGridUtils) {
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

export function housingColHousingTag1Placed(util: HousingGridUtils) {
  return util.colDef({
    colId: 'housingTag1Placed',
    headerValueGetter: () => 'Placement',
    headerName: 'Placement',
    field: util.fieldName('HousingTag1 Placed'),
    valueFormatter: ({ value }) => humanize(value),
    filter: SelectFilter,
    width: 150,
  })
}

export function housingColUiHousingCategory(util: HousingGridUtils) {
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

export function housingColHowToObtain(util: HousingGridUtils) {
  return util.colDef({
    colId: 'howToObtain',
    headerValueGetter: () => 'Obtain',
    field: util.fieldName('HowToOptain (Primarily)'),
    valueFormatter: ({ value }) => humanize(value),
    filter: SelectFilter,
    width: 150,
  })
}

export function housingColHousingTags(util: HousingGridUtils) {
  return util.colDef({
    colId: 'housingTags',
    headerValueGetter: () => 'Housing Tags',
    width: 250,
    field: util.fieldName('HousingTags'),
    valueGetter: ({ data, colDef }) => {
      return (data[colDef.field] || '').trim().split('+')
    },
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
