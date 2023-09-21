import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { VirtualGridCellComponent, VirtualGridOptions, provideVirtualGridOptions } from '~/ui/virtual-grid'
import { ItemDetailModule } from '../item-detail'
import { EmptyComponent } from '~/widgets/empty'

@Component({
  standalone: true,
  selector: 'nwb-item-view',
  template: `
    <nwb-item-detail-header
      [nwbItemDetail]="data?.ItemID"
      [enableInfoLink]="true"
      [enableTracker]="true"
      [enableLink]="true"
    ></nwb-item-detail-header>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule, ItemDetailModule],
  host: {
    class: 'block rounded-md overflow-clip m-1',
  },
})
export class ItemGridCellComponent implements VirtualGridCellComponent<ItemDefinitionMaster> {
  public static provideGridOptions() {
    return provideVirtualGridOptions(this.buildGridOptions())
  }

  public static buildGridOptions(): VirtualGridOptions<ItemDefinitionMaster> {
    return {
      height: 90,
      width: 320,
      gridClass: ['-mx-1'],
      cellDataView: ItemGridCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  @Input()
  public data: ItemDefinitionMaster

  @Input()
  public selected: boolean
}
