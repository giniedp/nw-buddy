import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { Backstorydata } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { EmptyComponent } from '~/widgets/empty'
import { BackstoryTableRecord, InventoryItem } from './backstory-table-cols'
import { getItemRarity, isItemNamed, isMasterItem } from '@nw-data/common'

const BACKGROUND_IMAGES = {
  Faction1: 'url(assets/backstories/backstory_image_marauders.png)',
  Faction2: 'url(assets/backstories/backstory_image_covenant.png)',
  Faction3: 'url(assets/backstories/backstory_image_syndicate.png)',
  Default: 'url(assets/backstories/backstory_image_level.png)',
}

@Component({
  standalone: true,
  selector: 'nwb-backstory-cell',
  templateUrl: './backstory-cell.component.html',
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule],
  host: {
    class: 'flex flex-col bg-base-300 rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class BackstoryCellComponent implements VirtualGridCellComponent<BackstoryTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<BackstoryTableRecord> {
    return {
      height: 800,
      width: 400,
      cellDataView: BackstoryCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return humanize(item?.BackstoryName)
      },
    }
  }

  @Input()
  public data: BackstoryTableRecord

  public get backgroundImage() {
    return BACKGROUND_IMAGES[this.data?.FactionOverride] || BACKGROUND_IMAGES.Default
  }

  @Input()
  public selected: boolean

  public constructor(protected grid: VirtualGridComponent<BackstoryTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }

  protected itemRarity(item: InventoryItem) {
    item.perks
    return getItemRarity(item.item)
  }

  protected itemNamed(item: InventoryItem) {
    return isMasterItem(item.item) && isItemNamed(item.item)
  }
}
