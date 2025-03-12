import { CommonModule } from '@angular/common'
import { Component, HostListener, InjectionToken, Input, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'
import { TransmogSectionComponent } from './transmog-section.component'
import { TransmogTileComponent } from './transmog-tile.component'
import { TransmogRecord } from './types'
import { TooltipModule } from '~/ui/tooltip'

const TRANSMOG_CELL_OPTIONS = new InjectionToken<TransmogCellOptions>('TRANSMOG_CELL_OPTIONS', {
  providedIn: 'root',
  factory: (): TransmogCellOptions => {
    return {
      navigate: false,
      tooltips: false,
    }
  },
})

export interface TransmogCellOptions {
  navigate?: boolean
  tooltips?: boolean
}

export function provideTransmogCellOptions(value: TransmogCellOptions) {
  return {
    provide: TRANSMOG_CELL_OPTIONS,
    useValue: value,
  }
}

export function injectTransmogCellOptions(): TransmogCellOptions {
  return inject(TRANSMOG_CELL_OPTIONS)
}

@Component({
  selector: 'nwb-transmog-cell',
  template: `
    <a
      [nwbTransmogTile]="item"
      [routerLink]="options.navigate ? item.id : null"
      [routerLinkActive]="'border-primary'"
      class="block w-[130px] h-[130px] mx-auto bg-base-300 rounded-md border border-base-100 hover:border-primary relative transition-all "
      [class.border-primary]="selected"
      [tooltip]="tooltip | nwText"
    ></a>
  `,
  imports: [CommonModule, NwModule, TransmogTileComponent, RouterModule, TooltipModule],
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
        return [item.id, tl8(item.appearance.Name)].join(' ')
      },
    }
  }

  @Input()
  public set data(value: TransmogRecord) {
    this.item = value
  }
  public get data() {
    return this.item
  }

  public get tooltip() {
    return this.options.tooltips ? this.item.appearance.Name : null
  }

  @Input()
  public selected: boolean

  protected item: TransmogRecord
  protected options = injectTransmogCellOptions()
  protected grid = inject(VirtualGridComponent<TransmogRecord>)

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onEvent(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
