import { CommonModule } from '@angular/common'
import { Component, HostListener, Input } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwModule } from '~/nw'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import {
  VirtualGridCellComponent,
  VirtualGridComponent,
  VirtualGridOptions,
  provideVirtualGridOptions,
} from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { ItemDetailModule } from '../item-detail'
import { WeaponTypeTableRecord } from './weapon-type-table-cols'

@Component({
  selector: 'nwb-item-view',
  template: `
    <nwb-item-header class="gap-2">
      <picture class="aspect-video" *ngIf="icon">
        <img [nwImage]="icon" class="w-[135px] h-[76px] object-cover" />
      </picture>
      <nwb-item-header-content
        class="z-10"
        [title]="name | nwText | nwTextBreak: ' - '"
        [text1]="damageType | nwText"
        [text2]="category | nwText"
      />
    </nwb-item-header>
  `,
  imports: [CommonModule, ItemFrameModule, NwModule, TooltipModule, ItemDetailModule],
  host: {
    class: 'block rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
  },
})
export class WeaponTypeCellComponent implements VirtualGridCellComponent<WeaponTypeTableRecord> {
  public static provideGridOptions() {
    return provideVirtualGridOptions(this.buildGridOptions())
  }

  public static buildGridOptions(): VirtualGridOptions<WeaponTypeTableRecord> {
    return {
      height: 90,
      width: 320,
      cellDataView: WeaponTypeCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return tl8(item?.MasteryName || '')
      },
    }
  }

  @Input()
  public data: WeaponTypeTableRecord

  @Input()
  public selected: boolean

  protected get icon() {
    return this.data?.IconPath || NW_FALLBACK_ICON
  }

  protected get name() {
    return this.data?.UIName
  }
  protected get damageType() {
    if (this.data?.DamageType) {
      return `${this.data.DamageType}_DamageName`
    }
    return null
  }
  protected get category() {
    return this.data?.CategoryName
  }
  public constructor(
    protected grid: VirtualGridComponent<WeaponTypeTableRecord>,
    protected service: NwWeaponTypesService,
  ) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
