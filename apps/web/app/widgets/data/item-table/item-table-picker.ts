import { DataGridPicker } from '~/ui/data-grid'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { eqCaseInsensitive } from '~/utils'
import { ItemTableSource, buildPickerItemGridOptions } from './item-table-source'
import { ItemTableRecord } from './item-table-cols'
import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'

export function openItemsPicker(options: {
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
    persistKey: `picker:items-grid:${options.category || 'default'}`,
    grid: {
      type: ItemTableSource,
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
