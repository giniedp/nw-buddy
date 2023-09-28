import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'
import { DataViewPicker } from '~/ui/data/data-view'
import { WeaponTypeTableAdapter } from './weapon-type-table-adapter'
import { WeaponTypeTableRecord } from './weapon-type-table-cols'

export function openWeaponTypePicker(options: {
  dialog: Dialog
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
}) {
  return DataViewPicker.open<WeaponTypeTableRecord>(options.dialog, {
    title: options.title || 'Select Weapon Type',
    selection: options.selection,
    displayMode: ['grid'],
    dataView: {
      adapter: WeaponTypeTableAdapter,
    },
    config: {
      maxWidth: 800,
      maxHeight: 890,
      panelClass: ['w-full', 'h-full', 'p-4'],
      injector: options.injector,
    },
  })
}
