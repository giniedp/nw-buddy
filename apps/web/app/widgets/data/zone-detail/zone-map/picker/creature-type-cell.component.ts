import { Component, HostListener, Input, inject } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { CreatureType } from '@nw-data/generated'
import { VirtualGridCellComponent, VirtualGridComponent, VirtualGridOptions } from '~/ui/data/virtual-grid'
import { EmptyComponent } from '~/widgets/empty'

export interface CreatureTypeRecord {
  CreatureTypeID: CreatureType
  Category: string
  DisplayName: string
}

@Component({
  standalone: true,
  selector: 'nwb-creature-type-cell',
  template: ` {{ data?.DisplayName }} `,
  host: {
    class: 'btn btn-block justify-start text-left rounded-none',
    '[class.text-primary]': 'selected',
  },
})
export class CreatureTypeCellComponent implements VirtualGridCellComponent<CreatureTypeRecord> {
  public static buildGridOptions(): VirtualGridOptions<CreatureTypeRecord> {
    return {
      height: 48,
      width: 320,
      cols: 1,
      cellDataView: CreatureTypeCellComponent,
      cellEmptyView: EmptyComponent,
      getQuickFilterText: (item, tl8) => {
        return item.DisplayName
      },
    }
  }

  private grid = inject<VirtualGridComponent<CreatureTypeRecord>>(VirtualGridComponent)
  private state = signalState({
    selected: false,
    data: null as CreatureTypeRecord,
  })

  @Input()
  public set selected(value: boolean) {
    patchState(this.state, { selected: value })
  }
  public get selected() {
    return this.state.selected()
  }

  @Input()
  public set data(value: CreatureTypeRecord) {
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
