import { Component, HostListener, Input, inject } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { NwModule } from '~/nw'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'

export interface CreatureCategoryRecord {
  CategoryID: string
  DisplayName: string
}

@Component({
  selector: 'nwb-creature-category-cell',
  template: ` {{ data?.DisplayName }} `,
  imports: [NwModule],
  host: {
    class: 'btn btn-block justify-start text-left rounded-none font-mono',
    '[class.text-primary]': 'selected',
  },
})
export class CreatureCategoryCellComponent implements VirtualGridCellComponent<CreatureCategoryRecord> {
  public static buildGridOptions(): VirtualGridOptions<CreatureCategoryRecord> {
    return {
      height: 48,
      width: 320,
      cols: 1,
      cellDataView: CreatureCategoryCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item) => {
        return item.DisplayName
      },
    }
  }

  private grid = inject<VirtualGridComponent<CreatureCategoryRecord>>(VirtualGridComponent)
  private state = signalState({
    selected: false,
    data: null as CreatureCategoryRecord,
  })

  @Input()
  public set selected(value: boolean) {
    patchState(this.state, { selected: value })
  }
  public get selected() {
    return this.state.selected()
  }

  @Input()
  public set data(value: CreatureCategoryRecord) {
    patchState(this.state, { data: value })
  }
  public get data() {
    return this.state.data()
  }

  @HostListener('click', ['$event'])
  @HostListener('dblclick', ['$event'])
  @HostListener('keydown', ['$event'])
  public onEvent(e: Event) {
    this.grid.handleItemEvent(this.data, e)
  }
}
