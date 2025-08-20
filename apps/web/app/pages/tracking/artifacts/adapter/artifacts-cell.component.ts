import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { ArtifactRecord } from './types'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { IconsModule } from '~/ui/icons'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { svgRepeat } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-artifacts-cell',
  templateUrl: './artifacts-cell.component.html',
  styleUrls: ['./artifacts-cell.component.scss'],
  imports: [CommonModule, ItemDetailModule, NwModule, IconsModule, ItemTrackerModule, TooltipModule],
  host: {
    class: 'flex m-2',
  },
})
export class ArtifactCellComponent implements VirtualGridCellComponent<ArtifactRecord> {
  public static buildGridOptions(): VirtualGridOptions<ArtifactRecord> {
    return {
      height: 1000,
      width: 375,
      cellDataView: ArtifactCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return [tl8(item.Name), tl8(item.ItemTypeDisplayName)].join(' ')
      },
    }
  }

  @Input()
  public set data(value: ArtifactRecord) {
    this.item = value
    this.showBackside = false
  }

  @Input()
  public selected: boolean

  protected item: ArtifactRecord
  protected iconFlip = svgRepeat
  protected showBackside = false

  public constructor(protected grid: VirtualGridComponent<ArtifactRecord>) {
    //
  }
}
