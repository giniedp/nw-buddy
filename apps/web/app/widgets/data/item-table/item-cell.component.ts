import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/generated'
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
import { ItemTableRecord } from './item-table-cols'

@Component({
  standalone: true,
  selector: 'nwb-item-cell',
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
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
  },
})
export class ItemCellComponent implements VirtualGridCellComponent<ItemDefinitionMaster> {
  public static buildGridOptions(): VirtualGridOptions<ItemDefinitionMaster> {
    return {
      height: 90,
      width: 320,
      cellDataView: ItemCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item?.Name || '')
      },
    }
  }

  @Input()
  public data: ItemDefinitionMaster

  @Input()
  public selected: boolean

  public constructor(protected grid: VirtualGridComponent<ItemTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
