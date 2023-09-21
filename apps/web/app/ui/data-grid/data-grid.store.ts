import { GridOptions } from '@ag-grid-community/core'
import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { isEqual } from 'lodash'
import { AgGrid } from '../ag-grid'

export interface DataGridState<T> {
  grid?: AgGrid<T>
  identifyBy?: (it: T) => string | number
  gridData?: T[]
  gridOptions?: GridOptions<T>
  selection?: Array<string | number>

  multiSelect?: boolean
  filterModel?: any
}

@Injectable()
export class DataGridStore<T = unknown> extends ComponentStore<DataGridState<T>> {
  public readonly grid$ = this.select(({ grid }) => grid)
  public readonly gridData$ = this.select(({ gridData }) => gridData)
  public readonly gridOptions$ = this.select(({ gridOptions }) => gridOptions)
  public readonly selection$ = this.select(({ selection }) => selection, { equal: isEqual })
  public readonly identifyBy$ = this.selectSignal(({ identifyBy }) => identifyBy)

  public constructor() {
    super({})
  }
}
