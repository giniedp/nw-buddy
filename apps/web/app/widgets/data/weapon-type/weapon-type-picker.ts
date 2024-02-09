import { Injector } from '@angular/core'
import { DataViewPicker } from '~/ui/data/data-view'
import { WeaponTypeTableAdapter } from './weapon-type-table-adapter'
import { WeaponTypeTableRecord } from './weapon-type-table-cols'

export function openWeaponTypePicker(options: {
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  category?: string
}) {
  return DataViewPicker.from<WeaponTypeTableRecord>({
    injector: options.injector,
    title: options.title || 'Select Weapon Type',
    selection: options.selection,
    displayMode: ['grid'],
    dataView: {
      adapter: WeaponTypeTableAdapter,
    },
  })
}
