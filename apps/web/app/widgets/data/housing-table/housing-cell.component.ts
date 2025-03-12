import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import {
  VirtualGridCellComponent,
  VirtualGridComponent,
  VirtualGridOptions,
  provideVirtualGridOptions,
} from '~/ui/data/virtual-grid'
import { ItemDetailModule } from '../item-detail'
import { EmptyComponent } from '~/widgets/empty'
import { HousingTableRecord } from './housing-table-cols'

@Component({
  selector: 'nwb-item-view',
  template: `
    <nwb-item-detail-header
      [nwbItemDetail]="data?.HouseItemID"
      [enableInfoLink]="true"
      [enableTracker]="true"
      [enableLink]="true"
    />
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule, ItemDetailModule],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
  },
})
export class HousingCellComponent implements VirtualGridCellComponent<HouseItems> {
  public static provideGridOptions() {
    return provideVirtualGridOptions(this.buildGridOptions())
  }

  public static buildGridOptions(): VirtualGridOptions<HouseItems> {
    return {
      height: 90,
      width: 320,
      cellDataView: HousingCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  @Input()
  public data: HouseItems

  @Input()
  public selected: boolean

  public constructor(protected grid: VirtualGridComponent<HousingTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
