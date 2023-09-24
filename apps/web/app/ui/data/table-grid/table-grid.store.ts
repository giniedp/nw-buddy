import { GridOptions } from '@ag-grid-community/core'
import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { isEqual } from 'lodash'
import { AgGrid } from '~/ui/data/ag-grid'

export interface TableGridState<T> {
  grid?: AgGrid<T>
  identifyBy?: (it: T) => string | number
  gridData?: T[]
  gridOptions?: GridOptions<T>
  selection?: Array<string | number>

  multiSelect?: boolean
  filterModel?: any

  hasLoaded?: boolean
}

@Injectable()
export class TableGridStore<T = unknown> extends ComponentStore<TableGridState<T>> {
  public readonly grid$ = this.select(({ grid }) => grid)
  public readonly gridData$ = this.select(({ gridData }) => gridData)
  public readonly gridOptions$ = this.select(({ gridOptions }) => gridOptions)
  public readonly selection$ = this.select(({ selection }) => selection, { equal: isEqual })
  public readonly identifyBy$ = this.selectSignal(({ identifyBy }) => identifyBy)
  public readonly hasLoaded$ = this.select(({ hasLoaded }) => hasLoaded)

  public constructor() {
    super({})
  }
}
