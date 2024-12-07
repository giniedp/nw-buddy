import { GridOptions } from '@ag-grid-community/core'
import { Injectable } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'
import { AgGrid } from '~/ui/data/ag-grid'

export interface TableGridState<T> {
  grid?: AgGrid<T>
  identifyBy?: (it: T) => string | number
  gridData?: T[]
  gridOptions?: GridOptions<T>
  selection?: Array<string | number>
  pinned?: Array<string | number>

  multiSelect?: boolean
  filterModel?: any

  hasLoaded?: boolean
}

@Injectable()
export class TableGridStore<T = unknown> {
  private state = signalState<TableGridState<T>>({
    grid: null,
    identifyBy: null,
    gridData: [],
    gridOptions: null,
    selection: [],
    pinned: [],
    multiSelect: false,
    filterModel: null,
    hasLoaded: false,
  })

  public readonly grid = this.state.grid
  public readonly gridData = this.state.gridData
  public readonly gridOptions = this.state.gridOptions
  public readonly selection = this.state.selection
  public readonly pinned = this.state.pinned
  public readonly identifyBy = this.state.identifyBy
  public readonly hasLoaded = this.state.hasLoaded

  public patchState(state: Partial<TableGridState<T>>) {
    patchState(this.state, state)
  }
}
