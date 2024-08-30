import { LoreData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type LoreItemTableUtils = TableGridUtils<LoreItemTableRecord>
export type LoreItemTableRecord = LoreData & {
  $numChildren: number
}

export function loreColID(util: LoreItemTableUtils) {
  return util.colDef<string>({
    colId: 'loreID',
    headerValueGetter: () => 'ID',
    field: 'LoreID',
    hide: true,
  })
}

export function loreColTitle(util: LoreItemTableUtils) {
  return util.colDef<string>({
    colId: 'title',
    headerValueGetter: () => 'Title',
    width: 250,
    valueGetter: ({ data }) => util.i18n.get(data.Title),
  })
}

export function loreColBody(util: LoreItemTableUtils) {
  return util.colDef<string>({
    colId: 'body',
    headerValueGetter: () => 'Body',
    width: 250,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    valueGetter: ({ data }) => util.i18n.get(data.Body),
    cellRenderer: util.cellRenderer(({ value }) => {
      return util.el('div.max-h-16.overflow-hidden', {
        html: util.lineBreaksToHtml(value, { sanitize: true }),
      })
    }),
  })
}

export function loreColType(util: LoreItemTableUtils) {
  return util.colDef<string>({
    colId: 'type',
    headerValueGetter: () => 'Type',
    field: 'Type',
  })
}

export function loreColOrder(util: LoreItemTableUtils) {
  return util.colDef<number>({
    colId: 'order',
    headerValueGetter: () => 'Order',
    field: 'Order',
  })
}
