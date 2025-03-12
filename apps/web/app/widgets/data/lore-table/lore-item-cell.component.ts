import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, computed, inject } from '@angular/core'
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
import { LoreDetailStore } from '../lore-detail'
import { LoreItemTableRecord } from './lore-item-table-cols'
import { svgLocationDot, svgLocationDotSlash } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'

@Component({
  selector: 'nwb-lore-item-cell',
  templateUrl: './lore-item-cell.component.html',
  styleUrl: './lore-item-cell.component.scss',
  imports: [CommonModule, NwModule, IconsModule, TooltipModule, RouterModule],
  providers: [LoreDetailStore],
  host: {
    class: `
      relative flex flex-col gap-4 m-1
      rounded-md overflow-clip border border-base-100
    `,
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[class.bg-base-300]': '!isChapter()',
    '[class.bg-black]': 'isChapter()',
  },
})
export class LoreItemCellComponent implements VirtualGridCellComponent<LoreItemTableRecord> {
  protected store = inject(LoreDetailStore)

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
    this.store.load({ id: value?.LoreID })
    this.record = value
  }
  public get data() {
    return this.record
  }
  protected iconLocation = svgLocationDot
  protected iconNoLocation = svgLocationDotSlash

  protected parentId = computed(() => this.store.parent()?.LoreID)
  protected parentTitle = computed(() => this.store.parent()?.Title)

  protected grandParentId = computed(() => this.store.grandParent()?.LoreID)
  protected grandParentTitle = computed(() => this.store.grandParent()?.Title)

  protected title = this.store.title
  protected subtitle = this.store.subtitle
  protected body = this.store.body
  protected children = this.store.children
  protected pageNumber = this.store.pageNumber
  protected pageCount = this.store.pageCount
  protected orderNumber = computed(() => this.store.record()?.Order)

  protected isTopic = this.store.isTopic
  protected isChapter = this.store.isChapter
  protected isPage = this.store.isPage

  protected image = this.store.image

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
