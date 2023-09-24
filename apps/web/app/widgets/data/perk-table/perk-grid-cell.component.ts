import { CommonModule } from '@angular/common'
import { Component, HostBinding, HostListener, Input } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Perks } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'

@Component({
  standalone: true,
  selector: 'nwb-perk-grid-cell',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon" [nwLink]="perkId" [nwLinkResource]="'perk'" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="name | nwText | nwTextBreak : ' - '"
        [category]="'perk'"
        [subTitle]="type"
      ></nwb-item-header-content>
    </nwb-item-header>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
  },
})
export class PerkGridCellComponent implements VirtualGridCellComponent<Perks> {
  public static buildGridOptions(): VirtualGridOptions<Perks> {
    return {
      height: 90,
      width: 320,
      cellDataView: PerkGridCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item?.DisplayName || item?.SecondaryEffectDisplayName || '')
      },
    }
  }

  @Input()
  public selected: boolean

  @Input()
  public set data(value: Perks) {
    this.name = value?.DisplayName || value?.SecondaryEffectDisplayName
    this.icon = value?.IconPath || NW_FALLBACK_ICON
    this.description = value?.Description
    this.type = value?.PerkType
    this.perk = value
  }

  protected perk: Perks
  protected perkId: string
  protected name: string
  protected icon: string
  protected description: string
  protected type: string
  protected get ctx() {
    return this.context.forPerk(this.perk) as any
  }

  public constructor(protected grid: VirtualGridComponent<Perks>, protected context: NwTextContextService) {
    //
  }

  @HostListener('click', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.perk, e)
  }
}
