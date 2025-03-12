import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { MasterItemDefinitions } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { ItemDetailModule } from '../item-detail'
import { ItemTableRecord } from './item-table-cols'

@Component({
  selector: 'nwb-item-cell',
  template: `
    <nwb-item-detail-header
      [nwbItemDetail]="data?.ItemID"
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
    '[tabindex]': '0',
  },
})
export class ItemCellComponent implements VirtualGridCellComponent<MasterItemDefinitions> {
  public static buildGridOptions(): VirtualGridOptions<MasterItemDefinitions> {
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
  public data: MasterItemDefinitions

  @Input()
  public selected: boolean

  public constructor(protected grid: VirtualGridComponent<ItemTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
