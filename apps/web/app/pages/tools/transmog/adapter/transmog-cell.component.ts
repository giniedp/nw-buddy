import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { TransmogRecord } from './types'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { IconsModule } from '~/ui/icons'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { svgRepeat } from '~/ui/icons/svg'

@Component({
  standalone: true,
  selector: 'nwb-transmog-cell',
  templateUrl: './transmog-cell.component.html',
  styleUrls: ['./transmog-cell.component.scss'],
  imports: [CommonModule, ItemDetailModule, NwModule, IconsModule, ItemTrackerModule, TooltipModule],
  host: {
    class: 'flex m-2',
  },
})
export class ArtifactCellComponent implements VirtualGridCellComponent<TransmogRecord> {
  public static buildGridOptions(): VirtualGridOptions<TransmogRecord> {
    return {
      height: 1000,
      width: 375,
      cellDataView: ArtifactCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item.name)
      },
    }
  }

  @Input()
  public set data(value: TransmogRecord) {
    this.item = value
    this.showBackside = false
  }

  @Input()
  public selected: boolean

  protected item: TransmogRecord
  protected iconFlip = svgRepeat
  protected showBackside = false

  public constructor(protected grid: VirtualGridComponent<TransmogRecord>) {
    //
  }
}
