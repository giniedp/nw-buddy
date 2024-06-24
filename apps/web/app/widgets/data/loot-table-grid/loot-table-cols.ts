import { LootTable } from '@nw-data/common'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type LootTableGridUtils = TableGridUtils<LootTableGridRecord>
export type LootTableGridRecord = LootTable & {
  $parents: string[]
}

export function lootTableColId(util: LootTableGridUtils) {
  return util.colDef<string>({
    colId: 'id',
    headerValueGetter: () => 'ID',
    width: 200,
    hide: true,
    field: 'LootTableID',
  })
}
export function lootTableColName(util: LootTableGridUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: ({ data }) => humanize(data.LootTableID),
    getQuickFilterText: ({ value }) => value,
  })
}
export function lootTableColSource(util: LootTableGridUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerValueGetter: () => 'Source',
    width: 200,
    valueGetter: ({ data }) => {
      return data['$source']
    },
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => value,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function lootTableColConditions(util: LootTableGridUtils) {
  return util.colDef<string[]>({
    colId: 'conditions',
    headerValueGetter: () => 'Conditions',
    width: 200,
    field: 'Conditions',
    getQuickFilterText: ({ value }) => value?.join(' '),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function lootTableColMaxRoll(util: LootTableGridUtils) {
  return util.colDef<number>({
    colId: 'maxRoll',
    headerValueGetter: () => 'Max Roll',
    getQuickFilterText: () => '',
    field: 'MaxRoll',
    width: 130,
  })
}
export function lootTableColParents(util: LootTableGridUtils) {
  return util.colDef<string[]>({
    colId: 'parents',
    width: 600,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
    headerValueGetter: () => 'Parents',
    field: '$parents',
    getQuickFilterText: () => '',
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
