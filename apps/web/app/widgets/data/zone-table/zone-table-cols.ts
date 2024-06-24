import { getZoneDescription, getZoneDevName, getZoneIcon, getZoneName } from '@nw-data/common'
import { TerritoryDefinition } from '@nw-data/generated'
import { uniq } from 'lodash'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type ZoneTableUtils = TableGridUtils<ZoneTableRecord>
export type ZoneTableRecord = TerritoryDefinition & { $source?: string }

export function zoneColIcon(util: ZoneTableUtils) {
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
          attrs: { target: '_blank', href: util.tipLink('poi', String(data.TerritoryID)) },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: getZoneIcon(data),
          }),
        ),
      )
    }),
  })
}
export function zoneColName(util: ZoneTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    valueGetter: ({ data }) => {
      const name1 = getZoneName(data)
      const name2 = getZoneDevName(data)
      const names = [name1, name2]
        .map((it) => {
          const value = util.i18n.get(it)
          if (!value || value.startsWith('@')) {
            return null
          }
          return value
        })
        .filter((it) => !!it)
      return uniq(names).join(', ')
    },
    getQuickFilterText: ({ value }) => value,
    cellRenderer: util.cellRenderer(({ value }) => value.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
  })
}
export function zoneColDescription(util: ZoneTableUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 250,
    valueGetter: ({ data }) => {
      const value = getZoneDescription(data)
      const result = util.i18n.get(value)
      if (value === result) {
        return null
      }
      return result
    },
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function zoneColLootTags(util: ZoneTableUtils) {
  return util.colDef<string[]>({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    valueGetter: ({ data }) => ('LootTags' in data ? data.LootTags : null),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function zoneColLevelRange(util: ZoneTableUtils) {
  return util.colDef<string | number>({
    colId: 'levelRange',
    headerValueGetter: () => 'Level Range',
    getQuickFilterText: () => '',
    field: 'LevelRange',
    hide: false,
  })
}
export function zoneColVitalsCategory(util: ZoneTableUtils) {
  return util.colDef<string[]>({
    colId: 'vitalsCategory',
    headerValueGetter: () => 'Vitals Category',
    field: 'VitalsCategory',
    hide: false,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
