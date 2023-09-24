import { Column, ColumnState } from '@ag-grid-community/core'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

import { toSignal } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { BehaviorSubject, combineLatest, firstValueFrom, map, switchMap, tap } from 'rxjs'
import { AgGrid } from '~/ui/data/ag-grid'
import { gridHasAnyFilterPresent } from '~/ui/data/ag-grid/utils'
import { IconsModule } from '~/ui/icons'
import {
  svgArrowsLeftRight,
  svgCode,
  svgDockLeft,
  svgDockRight,
  svgEraser,
  svgEye,
  svgEyeSlash,
  svgFileCode,
  svgFileCsv,
  svgFilter,
} from '~/ui/icons/svg'
import { EditorDialogComponent } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-table-grid-panel',
  templateUrl: './table-grid-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, DialogModule, TooltipModule, QuicksearchModule],
  providers: [QuicksearchService],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class TableGridPanelComponent extends ComponentStore<{
  grid: AgGrid
}> {
  @Input()
  public set grid(value: AgGrid) {
    this.patchState({ grid: value })
  }

  private grid$ = this.select(({ grid }) => grid)

  protected isFilterActive$ = toSignal(gridHasAnyFilterPresent(this.grid$), {
    initialValue: false,
  })
  protected columns$ = this.grid$
    .pipe(
      tap(({ columnApi }) => this.colState.next(columnApi.getColumnState())),
      switchMap((grid) => {
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

  protected displayCols$ = combineLatest({
    search: this.qs.query$,
    cols: this.columns$,
  }).pipe(
    map(({ search, cols }) => {
      if (!search) {
        return cols
      }
      search = search.toLowerCase()
      return cols.filter((it) => {
        return it.colId?.toLowerCase()?.includes(search) || it.name?.toLowerCase()?.includes(search)
      })
    })
  )
  private colState = new BehaviorSubject<ColumnState[]>([])

  protected svgEye = svgEye
  protected svgEyeSlash = svgEyeSlash
  protected svgDockLeft = svgDockLeft
  protected svgDockRight = svgDockRight
  protected svgFileCsv = svgFileCsv
  protected svgArrowsLeftRight = svgArrowsLeftRight
  protected svgEraser = svgEraser
  protected svgFilter = svgFilter
  protected svgCode = svgCode
  protected svgFileCode = svgFileCode

  public constructor(private dialog: Dialog, private qs: QuicksearchService) {
    super({ grid: null })
  }

  protected async exportCsv() {
    const grid = await firstValueFrom(this.grid$)
    //const data = grid.api.getDataAsCsv({})
    // console.log(data)
    // saveAs(data)
  }

  protected async sizeToFit() {
    const grid = await firstValueFrom(this.grid$)
    grid?.columnApi.sizeColumnsToFit(900)
  }

  protected async autosizeColumns() {
    const grid = await firstValueFrom(this.grid$)
    grid?.columnApi.autoSizeAllColumns()
  }

  protected async resetColumns() {
    const grid = await firstValueFrom(this.grid$)
    grid?.columnApi.resetColumnState()
    this.colState.next(grid.columnApi.getColumnState())
  }

  protected async resetFilter() {
    const grid = await firstValueFrom(this.grid$)
    grid.api.setFilterModel({})
    grid.api.setQuickFilter('')
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

  protected async openCode() {
    const grid = await firstValueFrom(this.grid$)
    const rows = []
    grid.api.forEachNode((row) => {
      rows.push(row.data)
    })
    EditorDialogComponent.open(this.dialog, {
      data: {
        title: '',
        value: JSON.stringify(rows, null, 2),
        readonly: true,
        language: 'json',
        positive: 'Close',
      },
    })
  }

  private async submitState(state: ColumnState[]) {
    const grid = await firstValueFrom(this.grid$)
    grid.columnApi.applyColumnState({
      state: state,
    })
    this.colState.next(grid.columnApi.getColumnState())
  }

  private getHeaderName(grid: AgGrid<any, unknown>, col: Column) {
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
