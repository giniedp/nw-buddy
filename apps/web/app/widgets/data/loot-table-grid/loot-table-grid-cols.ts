import { LootTable } from '@nw-data/common'
import { SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { humanize } from '~/utils'

export type LootTableGridUtils = DataGridUtils<LootTableGridRecord>
export type LootTableGridRecord = LootTable & {
  $parents: string[]
}

export function lootTableColId(util: LootTableGridUtils) {
  return util.colDef({
    colId: 'id',
    headerValueGetter: () => 'ID',
    width: 200,
    hide: true,
    valueGetter: util.valueGetter(({ data }) => {
      return data.LootTableID
    }),
    getQuickFilterText: ({ value }) => value,
  })
}
export function lootTableColName(util: LootTableGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      return humanize(data.LootTableID)
    }),
    getQuickFilterText: ({ value }) => value,
  })
}
export function lootTableColSource(util: LootTableGridUtils) {
  return util.colDef({
    colId: 'source',
    headerValueGetter: () => 'Source',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      return data['$source']
    }),
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
  })
}
export function lootTableColConditions(util: LootTableGridUtils) {
  return util.colDef({
    colId: 'conditions',
    headerValueGetter: () => 'Conditions',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      return data.Conditions
    }),
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}
export function lootTableColMaxRoll(util: LootTableGridUtils) {
  return util.colDef({
    colId: 'maxRoll',
    headerValueGetter: () => 'Max Roll',
    field: util.fieldName('MaxRoll'),
    width: 130,
  })
}
export function lootTableColParents(util: LootTableGridUtils) {
  return util.colDef({
    colId: 'parents',
    width: 600,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
    headerValueGetter: () => 'Parents',
    valueGetter: util.fieldGetter('$parents'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
  })
}
