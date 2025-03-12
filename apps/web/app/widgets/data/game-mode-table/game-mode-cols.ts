import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_PERKDATA, GameModeData } from '@nw-data/generated'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type GameModeUtils = TableGridUtils<GameModeRecord>
export type GameModeRecord = GameModeData

export function gameModeColIcon(util: GameModeUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    getQuickFilterText: () => '',
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
        icon: data.IconPath || NW_FALLBACK_ICON,
      })
    }),
  })
}

export function gameModeColName(util: GameModeUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    wrapText: true,
    autoHeight: true,
    width: 300,
    valueGetter: ({ data }) => util.i18n.get(data.DisplayName),
  })
}

export function gameModeColDescription(util: GameModeUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 500,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    valueGetter: ({ data }) => util.i18n.get(data.Description),
    filterValueGetter: ({ data }) => util.i18n.get(data.Description),
  })
}
export function gameModeColLootTags(util: GameModeUtils) {
  return util.colDef<string[]>({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    width: 200,
    valueGetter: ({ data }) => data.LootTags || null,
    cellRenderer: util.tagsRenderer({
      transform: humanize,
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function gameModeColMutLootTags(util: GameModeUtils) {
  return util.colDef<string[]>({
    colId: 'mutLootTagsOverride',
    headerValueGetter: () => 'Mutation Loot Tags',
    width: 200,
    valueGetter: ({ data }) => data.MutLootTagsOverride || null,
    cellRenderer: util.tagsRenderer({
      transform: humanize,
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
