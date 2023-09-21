import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewPicker } from '~/ui/data-view/data-view-picker-dialog.component'
import { eqCaseInsensitive } from '~/utils'
import { ItemTableAdapter, buildPickerItemGridOptions } from './item-table-adapter'
import { ItemTableRecord } from './item-table-cols'

export function openItemsPicker(options: {
  db: NwDbService
  dialog: Dialog
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
}) {
  return DataViewPicker.open(options.dialog, {
    title: options.title || 'Pick item',
    selection: options.selection,
    persistKey: `picker:items-grid:${options.category || 'default'}`,
    dataView: {
      adapter: ItemTableAdapter,
      source: options.db.items.pipe(map(filterByCategory(options.category))),
      gridOptions: (utils) => {
        return {
          ...buildPickerItemGridOptions(utils),
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
    return (items: ItemTableRecord[]) => items
  }
  return (items: ItemTableRecord[]) => {
    return items.filter((it) => it.ItemClass?.some((cls) => eqCaseInsensitive(cls, category)))
  }
}
