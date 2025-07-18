import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, computed, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { EmptyComponent } from '~/widgets/empty'
import { selectBackgroundImage, selectBackstoryProps, selectBackstoryTradeSkills } from '../backstory-detail/selectors'
import { ItemDetailModule } from '../item-detail'
import { BackstoryTableRecord } from './backstory-table-cols'
import { IntersectionObserverModule } from '~/utils/intersection-observer'

@Component({
  selector: 'nwb-backstory-cell',
  templateUrl: './backstory-cell.component.html',
  imports: [
    CommonModule,
    ItemFrameModule,
    ItemDetailModule,
    NwModule,
    TooltipModule,
    RouterModule,
    IntersectionObserverModule,
  ],
  host: {
    class: 'flex flex-col bg-base-300 rounded-md overflow-clip m-1',
    '[class.outline]': 'selected',
    '[class.outline-primary]': 'selected',
    '[tabindex]': '0',
  },
})
export class BackstoryCellComponent implements VirtualGridCellComponent<BackstoryTableRecord> {
  public static buildGridOptions(): VirtualGridOptions<BackstoryTableRecord> {
    return {
      height: 800,
      width: [400, 400],
      cols: [1, 5],
      cellDataView: BackstoryCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return humanize(item?.BackstoryName)
      },
    }
  }

  @Input()
  public set data(value: BackstoryTableRecord) {
    this.record.set(value)
  }
  public get data() {
    return this.record()
  }

  public backgroundImage = computed(() => {
    return selectBackgroundImage(this.record())
  })

  @Input()
  public selected: boolean

  public isVisible = false

  protected record = signal<BackstoryTableRecord>(null)
  protected playerLevel = computed(() => this.record()?.LevelOverride || 0)
  protected tradeskills = computed(() => {
    return selectBackstoryTradeSkills(this.record())?.filter((it) => !!it.level)
  })
  protected props = computed(() => {
    return selectBackstoryProps(this.record())
  })
  public constructor(protected grid: VirtualGridComponent<BackstoryTableRecord>) {
    //
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onClick(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
