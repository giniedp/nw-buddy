import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'
import { TransmogTileComponent } from './transmog-tile.component'
import { TransmogSectionComponent } from './transmog-section.component'
import { TransmogRecord } from './types'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-transmog-cell',
  template: `
    <a
      [nwbTransmogTile]="item"
      [routerLink]="item.id"
      [routerLinkActive]="'border-primary'"
      class="block w-[130px] h-[130px] mx-auto bg-base-300 rounded-md border border-base-100 hover:border-primary relative transition-all "
    ></a>
  `,
  imports: [CommonModule, NwModule, TransmogTileComponent, RouterModule],
  host: {
    class: 'block m-2',
  },
})
export class TransmogCellComponent implements VirtualGridCellComponent<TransmogRecord> {
  public static buildGridOptions(): VirtualGridOptions<TransmogRecord> {
    return {
      height: 146,
      width: 146,
      cols: [1, 10],
      gridClass: ['max-w-[1460px]', 'mx-auto'],
      cellDataView: TransmogCellComponent,
      cellEmptyView: EmptyComponent,
      sectionRowView: TransmogSectionComponent,
      getSection(it) {
        return [it.category, it.subcategory].join('/')
      },
      getQuickFilterText: (item, tl8) => {
        if (item.id === 'specialcorruptedVar1_chest') {
          console.log(tl8)
          console.log(tl8(item.appearance.Name))
        }
        return tl8(item.appearance.Name)
      },
    }
  }

  @Input()
  public set data(value: TransmogRecord) {
    this.item = value
  }

  @Input()
  public selected: boolean

  protected item: TransmogRecord

  public constructor(protected grid: VirtualGridComponent<TransmogRecord>) {
    //
  }
}
