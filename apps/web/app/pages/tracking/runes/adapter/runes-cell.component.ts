import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgRepeat } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { EmptyComponent } from '~/widgets/empty'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { RunesRecord } from './types'
import { CraftingCalculatorComponent } from '~/widgets/crafting'

@Component({
  selector: 'nwb-runes-cell',
  templateUrl: './runes-cell.component.html',
  styleUrls: ['./runes-cell.component.scss'],
  imports: [
    CommonModule,
    ItemDetailModule,
    NwModule,
    IconsModule,
    ItemTrackerModule,
    TooltipModule,
    CraftingCalculatorComponent,
  ],
  host: {
    class: 'flex m-2',
  },
})
export class RunesCellComponent implements VirtualGridCellComponent<RunesRecord> {
  public static buildGridOptions(): VirtualGridOptions<RunesRecord> {
    return {
      height: 1200,
      width: 375,
      cellDataView: RunesCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (record, tl8) => {
        if (!record || !record.item) {
          return ''
        }
        return tl8(record.item.Name)
      },
    }
  }

  @Input()
  public set data(value: RunesRecord) {
    this.item = value
  }

  @Input()
  public selected: boolean

  protected item: RunesRecord
  protected trackByIndex = (i: number) => i

  public constructor(protected grid: VirtualGridComponent<RunesRecord>) {
    //
  }
}
