import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { MountTableRecord } from './mount-table-cols'
import { NW_FALLBACK_ICON } from '@nw-data/common'

@Component({
  selector: 'nwb-mount-cell',
  template: `
    <picture class="block w-full h-full">
      <img class="w-full h-full object-contain" [nwImage]="icon" />
    </picture>
    <h3 class="absolute bottom left-0 right-0 bottom-0 bg-black/50 px-3 py-2 text-lg font-bold">
      {{ title | nwText }}
    </h3>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule],
  host: {
    class: 'block relative rounded-md overflow-clip bg-base-300 border-base-100 m-2',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class MountCellComponent implements VirtualGridCellComponent<MountTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<MountTableRecord> {
    return {
      height: 220,
      width: 390,
      cols: [1, 4],
      gridClass: ['max-w-[1460px]', 'mx-auto'],
      cellDataView: MountCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item?.DisplayName || '')
      },
    }
  }

  @Input()
  public data: MountTableRecord

  @Input()
  public selected: boolean

  protected get icon() {
    return this.data?.HiResIconPath || NW_FALLBACK_ICON
  }
  protected get title() {
    return this.data?.DisplayName
  }

  public constructor(protected grid: VirtualGridComponent<MountTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
