import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_PERKS, Gamemodes, Territorydefinitions } from '@nw-data/generated'
import { NwTextContextService } from '~/nw/expression'
import { SelectFilter } from '~/ui/data/ag-grid'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type TerritoryUtils = TableGridUtils<TerritoryRecord>
export type TerritoryRecord = Territorydefinitions

export function territoryColIcon(util: TerritoryUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_PERKS),
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
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    wrapText: true,
    autoHeight: true,
    width: 300,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.NameLocalizationKey)),
  })
}

export function territoryColDescription(util: TerritoryUtils) {
  return util.colDef({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 500,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    filterValueGetter: ({ data }) => util.i18n.get(data.Description),
    valueGetter: ({ data }) => util.i18n.get(data.Description),
  })
}
export function territoryColLootTags(util: TerritoryUtils) {
  return util.colDef({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      return data.LootTags || null
    }),
    cellRenderer: util.tagsRenderer({
      transform: humanize,
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function territoryColRecommendedLevel(util: TerritoryUtils) {
  return util.colDef({
    colId: 'recommendedLevel',
    headerValueGetter: () => 'Recommended Level',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => data.RecommendedLevel),
    filter: SelectFilter,
    filterParams: SelectFilter.params({}),
  })
}
