import { ColDef, GridOptions } from '@ag-grid-community/core'
import { eqCaseInsensitive, humanize } from '~/utils'
import { GridSelectFilter } from '../../ag-grid/grid-select-filter'
import { colDefPrecision } from './col-defs'

export function addGenericColumns(
  target: GridOptions,
  opts: {
    props: Record<string, string>
    scope?: string
    defaults?: Partial<ColDef>
  },
) {
  const fields = Object.entries(opts.props)
  const scope = opts.scope
  for (const [field, type] of fields) {
    const exists = target.columnDefs.find((col: ColDef) => eqCaseInsensitive(col.colId, field))
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      ...(opts?.defaults || {}),
      colId: field,
      headerClass: 'bg-info/15',
      getQuickFilterText: () => '',
      headerValueGetter: () => humanize(field),
      valueGetter: ({ data }) => {
        if (scope) {
          return data[scope]?.[field]
        } else {
          return data[field]
        }
      },
      field: field,
    }
    colDef.filter = GridSelectFilter
    colDef.filterParams = {
      search: true,
    }
    if (type.includes('number')) {
      Object.assign(colDef, colDefPrecision)
    }
    target.columnDefs.push(colDef)
  }
  return target
}
