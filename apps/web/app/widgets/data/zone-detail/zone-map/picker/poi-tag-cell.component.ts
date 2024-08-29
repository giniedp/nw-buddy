import { Component, HostListener, Input, inject } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'

export interface PoiTagRecord {
  PoiTagID: string
  DisplayName: string
}

@Component({
  standalone: true,
  selector: 'nwb-poi-tag-cell',
  template: ` {{ data?.DisplayName }} `,
  host: {
    class: 'btn btn-block justify-start text-left rounded-none font-mono',
    '[class.text-primary]': 'selected',
  },
})
export class PoiTagCellComponent implements VirtualGridCellComponent<PoiTagRecord> {
  public static buildGridOptions(): VirtualGridOptions<PoiTagRecord> {
    return {
      height: 48,
      width: 320,
      cols: 1,
      cellDataView: PoiTagCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return item.DisplayName
      },
    }
  }

  private grid = inject<VirtualGridComponent<PoiTagRecord>>(VirtualGridComponent)
  private state = signalState({
    selected: false,
    data: null as PoiTagRecord,
  })

  @Input()
  public set selected(value: boolean) {
    patchState(this.state, { selected: value })
  }
  public get selected() {
    return this.state.selected()
  }

  @Input()
  public set data(value: PoiTagRecord) {
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
