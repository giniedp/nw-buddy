import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Column, ColumnState } from 'ag-grid-community'
import { AgGridCommon } from 'ag-grid-community/dist/lib/interfaces/iCommon'
import { BehaviorSubject, defer, filter, firstValueFrom, map, switchMap } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { IconsModule } from '../icons'
import { svgArrowsLeftRight, svgDockLeft, svgDockRight, svgEraser, svgEye, svgEyeSlash, svgFileCsv, svgFilter } from '../icons/svg'
import { DataTableAdapter } from './data-table-adapter'

@Component({
  standalone: true,
  selector: 'nwb-data-table-panel',
  templateUrl: './data-table-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule],
  host: {
    class: 'w-80 flex flex-col gap-1 bg-base-100 rounded-b-md p-2',
  },
})
export class DataTablePanelComponent {
  protected grid = this.adapter.grid
  protected columns = defer(() => this.grid)
    .pipe(filter((it) => !!it?.columnApi))
    .pipe(
      switchMap((grid) => {
        this.colState.next(grid.columnApi.getColumnState())
        return this.colState.pipe(
          map((state) => {
            return state.map((it) => {
              return {
                ...it,
                name: this.getHeaderName(grid, grid.columnApi.getColumn(it.colId)),
              }
            })
          })
        )
      })
    )
    .pipe(shareReplayRefCount(1))

  private colState = new BehaviorSubject<ColumnState[]>([])

  protected svgEye = svgEye
  protected svgEyeSlash = svgEyeSlash
  protected svgDockLeft = svgDockLeft
  protected svgDockRight = svgDockRight
  protected svgFileCsv = svgFileCsv
  protected svgArrowsLeftRight = svgArrowsLeftRight
  protected svgEraser = svgEraser
  protected svgFilter = svgFilter

  public constructor(private adapter: DataTableAdapter<any>) {
    //
  }

  protected async exportCsv() {
    const grid = await firstValueFrom(this.adapter.grid)
    const data = grid.api.getDataAsCsv({})
    // console.log(data)
    // saveAs(data)
  }

  protected async sizeToFit() {
    const grid = await firstValueFrom(this.adapter.grid)

    grid?.columnApi.sizeColumnsToFit(900)
  }

  protected async autosizeColumns() {
    const grid = await firstValueFrom(this.adapter.grid)
    grid?.columnApi.autoSizeAllColumns()
  }

  protected async resetColumns() {
    const grid = await firstValueFrom(this.adapter.grid)
    grid?.columnApi.resetColumnState()
    this.colState.next(grid.columnApi.getColumnState())
  }

  protected async resetFilter() {
    const grid = await firstValueFrom(this.adapter.grid)
    grid?.api.setFilterModel({})
  }

  protected toggleHide(id: string) {
    const state = this.colState.value.map((it) => {
      if (it.colId === id) {
        it.hide = !it.hide
      }
      return it
    })
    this.submitState(state)
  }

  protected togglePinLeft(id: string) {
    const state = this.colState.value.map((it) => {
      if (it.colId === id) {
        it.pinned = it.pinned === 'left' ? false : 'left'
      }
      return it
    })
    this.submitState(state)
  }

  protected togglePinRight(id: string) {
    const state = this.colState.value.map((it) => {
      if (it.colId === id) {
        it.pinned = it.pinned === 'right' ? false : 'right'
      }
      return it
    })
    this.submitState(state)
  }

  private async submitState(state: ColumnState[]) {
    const grid = await firstValueFrom(this.adapter.grid)
    grid.columnApi.applyColumnState({
      state: state,
    })
    this.colState.next(grid.columnApi.getColumnState())
  }

  private getHeaderName(grid: AgGridCommon<any>, col: Column) {
    const def = col.getColDef()
    if (def.headerName) {
      return def.headerName
    }
    if (typeof def.headerValueGetter === 'function') {
      return def.headerValueGetter({
        ...grid,
        colDef: def,
        column: col,
        location: null,
        columnGroup: null,
        providedColumnGroup: null,
      })
    }
    if (def.field) {
      return def.field
    }
    return col.getColId()
  }
}
