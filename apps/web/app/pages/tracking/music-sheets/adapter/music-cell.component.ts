import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { MusicRecord } from './types'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { IconsModule } from '~/ui/icons'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { svgRepeat } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-music-cell',
  templateUrl: './music-cell.component.html',
  styleUrls: ['./music-cell.component.scss'],
  imports: [CommonModule, ItemDetailModule, NwModule, IconsModule, ItemTrackerModule, TooltipModule],
  host: {
    class: 'flex m-2',
  },
})
export class MusicCellComponent implements VirtualGridCellComponent<MusicRecord> {
  public static buildGridOptions(): VirtualGridOptions<MusicRecord> {
    return {
      height: 250,
      width: 375,
      cellDataView: MusicCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item.Name)
      },
    }
  }

  @Input()
  public set data(value: MusicRecord) {
    this.item = value
    this.showBackside = false
  }

  @Input()
  public selected: boolean

  protected item: MusicRecord
  protected iconFlip = svgRepeat
  protected showBackside = false

  public constructor(protected grid: VirtualGridComponent<MusicRecord>) {
    //
  }
}
