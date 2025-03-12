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
import { TrophiesRecord } from './types'
import { CraftingCalculatorComponent } from '../../../../widgets/crafting/crafting-calculator.component'

@Component({
  selector: 'nwb-trophies-cell',
  templateUrl: './trophies-cell.component.html',
  styleUrls: ['./trophies-cell.component.scss'],
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
export class TrophiesCellComponent implements VirtualGridCellComponent<TrophiesRecord> {
  public static buildGridOptions(): VirtualGridOptions<TrophiesRecord> {
    return {
      height: 550,
      width: null, //360,
      cellDataView: TrophiesCellComponent,
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
  public set data(value: TrophiesRecord) {
    this.item = value
  }

  @Input()
  public selected: boolean

  protected item: TrophiesRecord
  protected trackByIndex = (i: number) => i

  public constructor(protected grid: VirtualGridComponent<TrophiesRecord>) {
    //
  }
}
