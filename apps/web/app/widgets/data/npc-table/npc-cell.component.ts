import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { EmptyComponent } from '~/widgets/empty'
import { NpcTableRecord } from './npc-table-cols'

@Component({
  selector: 'nwb-npc-grid-cell',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon" [nwLinkTooltip]="['npc', data?.npcs?.[0]?.id]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="data?.name | nwText | nwTextBreak: ' - '"
        [text1]="'NPC'"
        [text2]="data?.title | nwText | nwTextBreak: ' - '"
      />
    </nwb-item-header>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule],
  hostDirectives: [TooltipDirective],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class NpcGridCellComponent implements VirtualGridCellComponent<NpcTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<NpcTableRecord> {
    return {
      height: 90,
      width: [320, 320],
      cols: [1, 6],
      cellDataView: NpcGridCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return [tl8(item.name), tl8(item.title)].filter((it) => !!it).join(' ')
      },
    }
  }

  @Input()
  public selected: boolean

  @Input()
  public data: NpcTableRecord

  protected icon = NW_FALLBACK_ICON
  public constructor(
    protected grid: VirtualGridComponent<NpcTableRecord>,
    protected context: NwTextContextService,
  ) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onEvent(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
