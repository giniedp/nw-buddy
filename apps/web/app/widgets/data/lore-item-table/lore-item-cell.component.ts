import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, computed, inject, signal } from '@angular/core'
import { NwModule } from '~/nw'
import {
  VirtualGridCellComponent,
  VirtualGridComponent,
  VirtualGridOptions,
  provideVirtualGridOptions,
} from '~/ui/data/virtual-grid'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { LoreItemTableRecord } from './lore-item-table-cols'
import { LoreItemDetailStore } from '../lore-item-detail'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-lore-item-cell',
  templateUrl: './lore-item-cell.component.html',
  imports: [CommonModule, NwModule, TooltipModule, RouterModule],
  providers: [LoreItemDetailStore],
  host: {
    class: `
      relative flex flex-col gap-4 m-1
      rounded-md overflow-clip bg-base-300 border border-base-100
    `,
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
  },
})
export class LoreItemCellComponent implements VirtualGridCellComponent<LoreItemTableRecord> {
  protected store = inject(LoreItemDetailStore)

  public static provideGridOptions() {
    return provideVirtualGridOptions(this.buildGridOptions())
  }

  public static buildGridOptions(): VirtualGridOptions<LoreItemTableRecord> {
    return {
      height: 600,
      width: 400,
      cols: [1, 4],
      gridClass: ['max-w-[1600px]', 'mx-auto'],
      cellDataView: LoreItemCellComponent,
      cellEmptyView: EmptyComponent,
    }
  }

  @Input()
  public set data(value: LoreItemTableRecord) {
    this.store.load(value)
    this.record.set(value)
  }
  public get data() {
    return this.record()
  }

  protected title = toSignal(this.store.title$)
  protected subtitle = toSignal(this.store.subtitle$)
  protected body = toSignal(this.store.body$)
  protected children = toSignal(this.store.children$)
  protected pageNumber = toSignal(this.store.pageNumber$)
  protected pageCount = toSignal(this.store.pageCount$)
  protected orderNumber = toSignal(this.store.order$)
  protected parentTitle = toSignal(this.store.parentTitle$)
  protected parentId = toSignal(this.store.parentId$)
  protected isTopic = toSignal(this.store.isTopic$)
  protected isChapter = toSignal(this.store.isChapter$)
  protected isPage = toSignal(this.store.isPage$)

  protected image = toSignal(this.store.image$)

  @Input()
  public selected: boolean

  private record = signal<LoreItemTableRecord>(null)

  public constructor(protected grid: VirtualGridComponent<LoreItemTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    if (e.target instanceof HTMLAnchorElement) {
      return
    }
    this.grid.handleItemEvent(this.data, e)
  }

  protected selectId(id: string) {
    this.grid.selection = [id]
  }
}
