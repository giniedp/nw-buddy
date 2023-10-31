import { NW_FALLBACK_ICON } from '@nw-data/common'
import { PoiDefinition } from '@nw-data/generated'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type PoiTableUtils = TableGridUtils<PoiTableRecord>
export type PoiTableRecord = PoiDefinition

export function poiColIcon(util: PoiTableUtils) {
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
          attrs: { target: '_blank', href: util.tipLink('perk', String(data.TerritoryID)) },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: data.MapIcon || data.CompassIcon || data.TooltipBackground || NW_FALLBACK_ICON,
          })
        )
      )
    }),
  })
}
export function poiColName(util: PoiTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    valueGetter: ({ data }) => util.i18n.get(data.NameLocalizationKey),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function poiColDescription(util: PoiTableUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 250,
    valueGetter: ({ data }) => util.i18n.get(`${data.NameLocalizationKey}_description`),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function poiColGroupSize(util: PoiTableUtils) {
  return util.colDef<string | number>({
    colId: 'groupSize',
    headerValueGetter: () => 'groupSize',
    getQuickFilterText: () => '',
    field: 'GroupSize',
    hide: true,
  })
}
export function poiColLootTags(util: PoiTableUtils) {
  return util.colDef<string[]>({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    field: 'LootTags',
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function poiColLevelRange(util: PoiTableUtils) {
  return util.colDef<string | number>({
    colId: 'levelRange',
    headerValueGetter: () => 'Level Range',
    getQuickFilterText: () => '',
    field: 'LevelRange',
    hide: false,
  })
}
export function poiColVitalsCategory(util: PoiTableUtils) {
  return util.colDef<string[]>({
    colId: 'vitalsCategory',
    headerValueGetter: () => 'Vitals Category',
    field: 'VitalsCategory',
    hide: false,
  })
}
