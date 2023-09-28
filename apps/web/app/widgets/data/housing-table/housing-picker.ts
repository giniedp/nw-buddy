import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { eqCaseInsensitive } from '~/utils'
import { HousingTableAdapter, buildPickerHousingGridOptions } from './housing-table-adapter'
import { HousingTableRecord } from './housing-table-cols'

export function openHousingItemsPicker(options: {
  db: NwDbService
  dialog: Dialog
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
}) {
  return DataViewPicker.open<HousingTableRecord>(options.dialog, {
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
    config: {
      maxWidth: 1400,
      maxHeight: 1200,
      panelClass: ['w-full', 'h-full', 'p-4'],
      injector: options.injector,
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
