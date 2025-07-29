import { CommonModule } from '@angular/common'
import { Component, ElementRef, HostListener, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { DnDService } from '~/utils/services/dnd.service'
import { EmptyComponent } from '~/widgets/empty'
import { ItemDetailModule } from '../item-detail'
import { TRANSMOG_CATEGORIES } from '../transmog'
import { InventorySectionComponent } from './inventory-section.component'
import { InventoryTableRecord } from './inventory-table-cols'
import { categorizeInventoryItem } from './utils'

@Component({
  selector: 'nwb-inventory-cell',
  template: `
    <nwb-item-detail
      *ngIf="itemId"
      [itemId]="itemId"
      [perkOverride]="perks"
      class="p-1"
      class="flex flex-row gap-1 w"
      [tooltip]="tplTip"
      [tooltipClass]="'p-0'"
      #detail
    >
      <nwb-item-header [rarity]="detail.rarity()" [isNamed]="detail.isNamed()" class="relative font-nimbus gap-2">
        <nwb-item-icon [nwbItemIcon]="item" [solid]="true" class="z-10 aspect-square"></nwb-item-icon>
        @if (detail.slottedGemIcon(); as icon) {
          <span class="z-10 absolute bottom-0 right-0 p-[2px] rounded-tl-xl bg-base-100/50">
            <img [nwImage]="icon" class="w-5 h-5" />
          </span>
        }
        <span class="z-10 absolute top-0 left-0 px-2 py-[2px]">
          {{ detail.tierLabel() }}
        </span>
        <span class="z-10 absolute bottom-0 left-0 px-[5px] rounded-tr-xl bg-base-100/50">
          {{ gearScore }}
        </span>
      </nwb-item-header>
    </nwb-item-detail>

    <ng-template #tplTip>
      <nwb-item-card class="relative flex-1" [entity]="itemId" [gsOverride]="gearScore" [perkOverride]="perks" />
    </ng-template>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule, ItemDetailModule],
  host: {
    class: 'block rounded-md overflow-clip m-1 cursor-grab',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
    draggable: 'true',
  },
})
export class InventoryCellComponent implements VirtualGridCellComponent<InventoryTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<InventoryTableRecord> {
    return {
      height: 90,
      width: 90,
      cellDataView: InventoryCellComponent,
      cellEmptyView: EmptyComponent,
      sectionRowView: InventorySectionComponent,
      getSection(it) {
        const { category, subcategory } = categorizeInventoryItem(it.item, TRANSMOG_CATEGORIES)
        return [category, subcategory].join('/')
      },
      getQuickFilterText: (item, tl8) => {
        return tl8(item?.item?.Name || '')
      },
    }
  }

  @Input()
  public data: InventoryTableRecord

  @Input()
  public selected: boolean

  protected get item() {
    return this.data?.item
  }
  protected get itemId() {
    return this.data.record.itemId
  }
  protected get perks() {
    return this.data.record.perks
  }
  protected get gearScore() {
    return this.data.record.gearScore
  }
  public constructor(
    protected grid: VirtualGridComponent<InventoryTableRecord>,
    private dnd: DnDService,
    private elRef: ElementRef<HTMLElement>,
  ) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }

  @HostListener('dragstart', ['$event'])
  public onDragStart(e: DragEvent) {
    const json = JSON.stringify(this.data)
    e.dataTransfer.setData('applicavtion/json', json)
    e.dataTransfer.setDragImage(
      this.elRef.nativeElement,
      -this.elRef.nativeElement.clientWidth,
      -this.elRef.nativeElement.clientHeight,
    )
    this.dnd.data = JSON.parse(json)
  }
}
