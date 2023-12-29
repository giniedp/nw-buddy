import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import {
  VirtualGridCellComponent,
  VirtualGridComponent,
  VirtualGridOptions,
  provideVirtualGridOptions,
} from '~/ui/data/virtual-grid'
import { TooltipModule } from '~/ui/tooltip'
import { EmptyComponent } from '~/widgets/empty'
import { LoreItemDetailStore } from '../lore-item-detail'
import { LoreItemTableRecord } from './lore-item-table-cols'

@Component({
  standalone: true,
  selector: 'nwb-lore-item-cell',
  templateUrl: './lore-item-cell.component.html',
  styleUrl: './lore-item-cell.component.scss',
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
      height: 400,
      width: 400,
      cols: [1, 4],
      gridClass: ['max-w-[1600px]', 'mx-auto'],
      cellDataView: LoreItemCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (record, tl8) => {
        return [tl8(record.Title), tl8(record.Subtitle), tl8(record.Body)].filter((it) => !!it).join(' ')
      },
    }
  }

  @Input()
  public set data(value: LoreItemTableRecord) {
    this.store.load(value)
    this.record = value
  }
  public get data() {
    return this.record
  }

  protected parentId = toSignal(this.store.parentId$)
  protected parentTitle = toSignal(this.store.parentTitle$)

  protected grandParentId = toSignal(this.store.grandParentId$)
  protected grandParentTitle = toSignal(this.store.grandParentTitle$)

  protected title = toSignal(this.store.title$)
  protected subtitle = toSignal(this.store.subtitle$)
  protected body = toSignal(this.store.body$)
  protected children = toSignal(this.store.children$)
  protected pageNumber = toSignal(this.store.pageNumber$)
  protected pageCount = toSignal(this.store.pageCount$)
  protected orderNumber = toSignal(this.store.order$)

  protected isTopic = toSignal(this.store.isTopic$)
  protected isChapter = toSignal(this.store.isChapter$)
  protected isPage = toSignal(this.store.isPage$)

  protected image = toSignal(this.store.image$)

  protected title1 = computed(() => {
    if (this.isTopic()) {
      return this.title()
    }
    if (this.isChapter()) {
      return this.parentTitle()
    }
    return this.grandParentTitle()
  })
  protected title2 = computed(() => {
    if (this.isTopic()) {
      return null
    }
    if (this.isChapter()) {
      return this.title()
    }
    return this.parentTitle()
  })
  protected title3 = computed(() => {
    if (this.isTopic() || this.isChapter()) {
      return null
    }
    return this.title()
  })
  protected title4 = computed(() => {
    return this.subtitle()
  })

  @Input()
  public selected: boolean

  private record: LoreItemTableRecord

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
