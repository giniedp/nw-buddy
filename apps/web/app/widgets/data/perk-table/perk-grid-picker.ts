import { Dialog } from '@angular/cdk/dialog'
import { Injector } from '@angular/core'
import { NwDbService } from '~/nw'
import { DataGridPicker } from '~/ui/data-grid'
import { PerkTableSource, buildPerkTablePickerOptions } from './perk-table-source'
import { Observable } from 'rxjs'
import { PerkTableRecord } from './perk-table-cols'
import { NwTextContextService } from '~/nw/expression'

export function openPerksPicker(options: {
  db: NwDbService
  dialog: Dialog
  ctx: NwTextContextService
  injector?: Injector
  title?: string
  selection?: string[]
  multiple?: boolean
  source: Observable<PerkTableRecord[]>
}) {
  return DataGridPicker.open(options.dialog, {
    title: options.title || 'Pick perk',
    selection: options.selection,
    // persistKey: `picker:perks-grid:${options.category || 'default'}`,
    grid: {
      type: PerkTableSource,
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
