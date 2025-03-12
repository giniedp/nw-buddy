import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, OnInit, TemplateRef, ViewChild } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { ItemDetailModule } from '../item-detail'
import { StatusEffectTableRecord } from './status-effect-table-cols'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'

@Component({
  selector: 'nwb-item-cell',
  template: `
    <nwb-item-header class="gap-2">
      <picture class="aspect-square" *ngIf="icon">
        <img [nwImage]="icon" class="w-[76px] h-[76px]" />
      </picture>
      <nwb-item-header-content
        class="z-10"
        [title]="name | nwText | nwTextBreak: ' - '"
        [text1]="source"
        [text2]="'Status Effect'"
      />
    </nwb-item-header>
    <ng-template #tplTip>
      <div [nwHtml]="description | nwText | nwTextBreak" class="px-2 py-1"></div>
    </ng-template>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule, ItemDetailModule],
  hostDirectives: [TooltipDirective],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class StatusEffectCellComponent implements VirtualGridCellComponent<StatusEffectTableRecord>, OnInit {
  public static buildGridOptions(): VirtualGridOptions<StatusEffectTableRecord> {
    return {
      height: 90,
      width: 320,
      cellDataView: StatusEffectCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item?.DisplayName || '')
      },
    }
  }

  @Input()
  public data: StatusEffectTableRecord

  @Input()
  public selected: boolean

  @ViewChild('tplTip', { static: true })
  protected tplTip: TemplateRef<unknown>

  protected get icon() {
    return this.data?.PlaceholderIcon || NW_FALLBACK_ICON
  }
  protected get name() {
    return this.data?.DisplayName
  }
  protected get description() {
    return this.data?.Description
  }
  protected get source() {
    return this.data?.['$source']
  }

  public constructor(
    protected grid: VirtualGridComponent<StatusEffectTableRecord>,
    private tip: TooltipDirective,
  ) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }

  public ngOnInit() {
    this.tip.tooltip = this.tplTip
  }
}
