import { ColDef, ITooltipParams } from '@ag-grid-community/core'

export const colDefPrecision: ColDef = {
  filter: 'agNumberColumnFilter',
  valueFormatter: ({ value }) => (typeof value === 'number' ? Number(value.toFixed(7)) : value),
  getQuickFilterText: ({ value }) => (typeof value === 'number' ? value.toFixed(7) : value),
  tooltipValueGetter: ({ valueFormatted, value }: ITooltipParams) => {
    if (valueFormatted !== value) {
      return value
    }
    return null
  },
}
