import { Injector } from '@angular/core'
import { DataViewPicker } from '~/ui/data/data-view'
import { eqCaseInsensitive } from '~/utils'
import { HousingTableAdapter, buildPickerHousingGridOptions } from './housing-table-adapter'
import { HousingTableRecord } from './housing-table-cols'

export function openHousingItemsPicker(options: {
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
}) {
  return DataViewPicker.from<HousingTableRecord>({
    injector: options.injector,
    title: options.title || 'Pick item',
    selection: options.selection,
    persistKey: 'housing-grid-picker',
    dataView: {
      adapter: HousingTableAdapter,
      filter: itemFilter(options.category),
      sort: (a, b) => b.Tier - a.Tier,
      gridOptions: (utils) => {
        return {
          ...buildPickerHousingGridOptions(utils),
          rowSelection: options.multiple ? 'multiple' : 'single',
        }
      },
    },
  })
}

function itemFilter(category: string) {
  if (!category) {
    return () => true
  }

  return (it: HousingTableRecord) => {
    return eqCaseInsensitive(it.UIHousingCategory, category)
  }
}
