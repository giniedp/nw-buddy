import { ColDef, ITooltipParams } from '@ag-grid-community/core'
import { patchPrecision } from '@nw-data/common'

export const colDefPrecision: ColDef = {
  filter: 'agNumberColumnFilter',
  valueFormatter: ({ value }) => (typeof value === 'number' ? patchPrecision(value) : value),
  getQuickFilterText: ({ value }) => (typeof value === 'number' ? patchPrecision(value).toString() : value),
  tooltipValueGetter: ({ valueFormatted, value }: ITooltipParams) => {
    if (valueFormatted !== value) {
      return value
    }
    return null
  },
}
