import { NW_FALLBACK_ICON } from '@nw-data/common'
import { PoiDefinition } from '@nw-data/generated'
import { SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { humanize } from '~/utils'

export type PoiGridUtils = DataGridUtils<PoiGridRecord>
export type PoiGridRecord = PoiDefinition

export function poiCol(util: PoiGridUtils) {
  //
}

export function poiColIcon(util: PoiGridUtils) {
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
          attrs: { target: '_blank', href: util.nwLink.link('perk', String(data.TerritoryID)) },
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
export function poiColName(util: PoiGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.NameLocalizationKey)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function poiColDescription(util: PoiGridUtils) {
  return util.colDef({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 250,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(`${data.NameLocalizationKey}_description`)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function poiColGroupSize(util: PoiGridUtils) {
  return util.colDef({
    colId: 'groupSize',
    headerValueGetter: () => 'groupSize',
    valueGetter: util.fieldGetter('GroupSize'),
    hide: true,
  })
}
export function poiColLootTags(util: PoiGridUtils) {
  return util.colDef({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    valueGetter: util.fieldGetter('LootTags'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function poiColLevelRange(util: PoiGridUtils) {
  return util.colDef({
    colId: 'levelRange',
    headerValueGetter: () => 'Level Range',
    valueGetter: util.fieldGetter('LevelRange'),
    hide: false,
  })
}
export function poiColVitalsCategory(util: PoiGridUtils) {
  return util.colDef({
    colId: 'vitalsCategory',
    headerValueGetter: () => 'Vitals Category',
    valueGetter: util.fieldGetter('VitalsCategory'),
    hide: false,
  })
}