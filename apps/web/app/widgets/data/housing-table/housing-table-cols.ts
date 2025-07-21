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
} from '@nw-data/common'
import { HouseItems } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type HousingTableUtils = TableGridUtils<HousingTableRecord>
export type HousingTableRecord = HouseItems

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
        }),
      )
    }),
  })
}

export function housingColName(util: HousingTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 300,
    valueGetter: ({ data }) => util.i18n.get(data.Name),
    getQuickFilterText: ({ data }) => util.i18n.get(data.Name),
  })
}

export function housingColID(util: HousingTableUtils) {
  return util.colDef<string>({
    colId: 'houseItemId',
    headerValueGetter: () => 'Item ID',
    field: 'HouseItemID',
    hide: true,
  })
}

export function housingColRarity(util: HousingTableUtils) {
  return util.colDef<ItemRarity>({
    colId: 'rarity',
    width: 130,
    headerValueGetter: () => 'Rarity',
    valueGetter: ({ data }) => getItemRarity(data),
    valueFormatter: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    comparator: (a, b) => getItemRarityWeight(a) - getItemRarityWeight(b),
    ...util.selectFilter({
      order: 'asc',
      getOptions: ({ data }) => {
        const value = getItemRarity(data)
        return [
          {
            id: value,
            label: util.i18n.get(getItemRarityLabel(value)),
            order: getItemRarityWeight(value),
            class: ['text-rarity-' + value],
          },
        ]
      },
    }),
  })
}

export function housingColTier(util: HousingTableUtils) {
  return util.colDef<number>({
    colId: 'tier',
    headerValueGetter: () => 'Tier',
    width: 80,
    valueGetter: ({ data }) => data.Tier || null,
    valueFormatter: ({ value }) => getItemTierAsRoman(value),
    getQuickFilterText: () => '',
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function housingColUserBookmark(util: HousingTableUtils) {
  return util.colDef<number>({
    colId: 'userBookmark',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Bookmark',
    getQuickFilterText: () => '',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: ({ data }) => util.character.getItemMarker(data.HouseItemID),
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (value: HouseItems) => getItemId(value),
      character: util.character,
    }),
  })
}

export function housingColUserStockValue(util: HousingTableUtils) {
  return util.colDef<number>({
    colId: 'userStockValue',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'In Stock',
    getQuickFilterText: () => '',
    headerTooltip: 'Number of items currently owned',
    valueGetter: ({ data }) => util.itemPref.get(data.HouseItemID)?.stock,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: HouseItems) => getItemId(value),
      pref: util.itemPref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function housingColUserPrice(util: HousingTableUtils) {
  return util.colDef<number>({
    colId: 'userPrice',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Price',
    getQuickFilterText: () => '',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: ({ data }) => util.itemPref.get(data.HouseItemID)?.price,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: HouseItems) => getItemId(value),
      pref: util.itemPref,
      mode: 'price',
      // formatter: util.moneyFormatter, TODO:
    }),
    width: 100,
  })
}

export function housingColHousingTag1Placed(util: HousingTableUtils) {
  return util.colDef<string[]>({
    colId: 'housingTag1Placed',
    headerValueGetter: () => 'Placement',
    headerName: 'Placement',
    field: 'HousingTag1 Placed',
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => humanize(value),
    width: 150,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function housingColUiHousingCategory(util: HousingTableUtils) {
  return util.colDef<string>({
    colId: 'uiHousingCategory',
    headerValueGetter: () => 'Housing Category',
    field: 'UIHousingCategory',
    valueFormatter: ({ value }) => util.i18n.get(getUIHousingCategoryLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getUIHousingCategoryLabel(value)),
    width: 150,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function housingColHowToObtain(util: HousingTableUtils) {
  return util.colDef<string>({
    colId: 'howToObtain',
    headerValueGetter: () => 'Obtain',
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => humanize(value),
    width: 150,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function housingColHousingTags(util: HousingTableUtils) {
  return util.colDef<string[]>({
    colId: 'housingTags',
    headerValueGetter: () => 'Housing Tags',
    width: 250,
    valueGetter: util.fieldGetter('HousingTags'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
