import { DataGridPicker } from '~/ui/data-grid'
import { HousingTableSource, buildPickerHousingGridOptions } from './housing-table-source'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { eqCaseInsensitive } from '~/utils'
import { HousingTableRecord } from './housing-table-cols'
import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'

export function openHousingItemsPicker(options: {
  db: NwDbService
  dialog: Dialog
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
}) {
  return DataGridPicker.open(options.dialog, {
    title: options.title || 'Pick item',
    selection: options.selection,
    persistKey: 'housing-grid-picker',
    grid: {
      type: HousingTableSource,
      source: options.db.housingItems.pipe(map(filterByCategory(options.category))),
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

function filterByCategory(category: string) {
  if (!category) {
    return (items: HousingTableRecord[]) => items
  }
  return (items: HousingTableRecord[]) => {
    return items.filter((it) => eqCaseInsensitive(it.UIHousingCategory, category))
  }
}
