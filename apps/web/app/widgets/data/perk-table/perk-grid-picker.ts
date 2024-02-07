import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { NwDataService } from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { DataViewPicker } from '~/ui/data/data-view'
import { PerkTableAdapter, buildPerkTablePickerOptions } from './perk-table-adapter'
import { PerkTableRecord } from './perk-table-cols'

export function openPerksPicker(options: {
  db: NwDataService
  dialog: Dialog
  ctx: NwTextContextService
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  source: Observable<PerkTableRecord[]>
}) {
  return DataViewPicker.from({
    injector: options.injector,
    title: options.title || 'Pick perk',
    selection: options.selection,
    // persistKey: `picker:perks-grid:${options.category || 'default'}`,
    dataView: {
      adapter: PerkTableAdapter,
      source: options.source,
      gridOptions: (utils) => {
        return {
          ...buildPerkTablePickerOptions(utils, options.ctx),
          rowSelection: options.multiple ? 'multiple' : 'single',
        }
      },
    },
  })
}
