import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_PERKDATA, TerritoryDefinition } from '@nw-data/generated'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type TerritoryUtils = TableGridUtils<TerritoryRecord>
export type TerritoryRecord = TerritoryDefinition

export function territoryColIcon(util: TerritoryUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_PERKDATA),
    }),
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elItemIcon({
        class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
        icon: NW_FALLBACK_ICON,
      })
    }),
  })
}

export function territoryColName(util: TerritoryUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    wrapText: true,
    autoHeight: true,
    width: 300,
    valueGetter: ({ data }) => util.i18n.get(data.NameLocalizationKey),
  })
}

export function territoryColLootTags(util: TerritoryUtils) {
  return util.colDef<string[]>({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    width: 200,
    field: 'LootTags',
    cellRenderer: util.tagsRenderer({
      transform: humanize,
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function territoryColRecommendedLevel(util: TerritoryUtils) {
  return util.colDef<number>({
    colId: 'recommendedLevel',
    headerValueGetter: () => 'Recommended Level',
    getQuickFilterText: () => '',
    width: 200,
    field: 'RecommendedLevel',
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
