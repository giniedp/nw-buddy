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
  return DataViewPicker.open(options.dialog, {
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
    config: {
      maxWidth: 1400,
      maxHeight: 1200,
      panelClass: ['w-full', 'h-full', 'p-4'],
      injector: options.injector,
    },
  })
}

// private openPerksPicker(item: ItemDefinitionMaster, perkOrBucket: Perks | PerkBucket) {
//   return DataTablePickerDialog.open(this.dialog, {
//     title: 'Choose Perk',
//     selection: ('PerkID' in perkOrBucket ? perkOrBucket : null)?.PerkID,
//     adapter: PerksTableAdapter.provider({
//       source: this.getAplicablePerks(item, perkOrBucket),
//     }),
//     config: {
//       maxWidth: 1400,
//       maxHeight: 1200,
//       panelClass: ['w-full', 'h-full', 'p-4'],
//       injector: this.injector,
//     },
//   })
// }
