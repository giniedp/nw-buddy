import { Column, ColumnState } from '@ag-grid-community/core'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

import { toSignal } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { BehaviorSubject, combineLatest, filter, firstValueFrom, map, switchMap, tap } from 'rxjs'
import { AgGrid } from '~/ui/data/ag-grid'
import { gridGetPinnedTopData, gridHasAnyFilterPresent } from '~/ui/data/ag-grid/utils'
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
  svgFilterCircleXmark,
  svgFloppyDisk,
  svgFloppyDiskArrow,
  svgThumbtack,
} from '~/ui/icons/svg'
import { EditorDialogComponent } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'
import { SaveStateDialogComponent } from './save-state-dialog.component'
import { LoadStateDialogComponent } from './load-state-dialog.component'

@Component({
  standalone: true,
  selector: 'nwb-table-grid-panel',
  templateUrl: './table-grid-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, DialogModule, TooltipModule, QuicksearchModule],
  providers: [QuicksearchService],
  host: {
    class: 'flex flex-col gap-1 h-full overflow-hidden',
  },
})
export class TableGridPanelComponent extends ComponentStore<{
  grid: AgGrid
  persistKey: string
}> {
  @Input()
  public set grid(value: AgGrid) {
    this.patchState({ grid: value })
  }

  @Input()
  public set persistKey(value: string) {
    this.patchState({ persistKey: value })
  }

  private grid$ = this.select(({ grid }) => grid)
  private persistKey$ = this.select(({ persistKey }) => persistKey)
  protected sigGrid = toSignal(this.grid$)
  protected sigPersistKey = toSignal(this.persistKey$)
  protected showColumns = false

  protected isFilterActive$ = toSignal(gridHasAnyFilterPresent(this.grid$), {
    initialValue: false,
  })
  protected columns$ = this.grid$
    .pipe(filter((it) => !!it))
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
  protected svgFilter = svgFilterCircleXmark
  protected svgCode = svgCode
  protected svgFileCode = svgFileCode
  protected svgPin = svgThumbtack
  protected svgDisk = svgFloppyDisk
  protected svgDiskArrow = svgFloppyDiskArrow
  public constructor(private dialog: Dialog, private qs: QuicksearchService) {
    super({ grid: null, persistKey: null })
  }

  protected async exportCsv() {
    const grid = await firstValueFrom(this.grid$)
    //const data = grid.api.getDataAsCsv({})
    // console.log(data)
    // saveAs(data)
  }

  protected sizeToFit() {
    const grid = this.sigGrid()
    grid?.columnApi.sizeColumnsToFit(900)
  }

  protected autosizeColumns() {
    const grid = this.sigGrid()
    grid?.columnApi.autoSizeAllColumns()
  }

  protected resetColumns() {
    const grid = this.sigGrid()
    grid?.columnApi.resetColumnState()
    this.colState.next(grid.columnApi.getColumnState())
  }

  protected resetFilter() {
    const grid = this.sigGrid()
    grid.api.setFilterModel({})
    grid.api.setQuickFilter('')
  }

  protected clearPins() {
    const grid = this.sigGrid()
    grid.api.setPinnedTopRowData()
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

  protected openCode() {
    const grid = this.sigGrid()
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

  protected saveState() {
    const grid = this.sigGrid()
    const key = this.sigPersistKey()
    SaveStateDialogComponent.open(this.dialog, {
      title: 'Save State',
      config: {},
      key: key,
      data: {
        columns: grid.columnApi.getColumnState(),
        filter: grid.api.getFilterModel(),
      },
    })
  }

  protected loadState() {
    LoadStateDialogComponent.open(this.dialog, {
      title: 'Load State',
      config: {},
      key: this.get(({ persistKey }) => persistKey),
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((state) => {
        const grid = this.get(({ grid }) => grid)
        grid.columnApi.applyColumnState({
          state: state.columns,
          applyOrder: true,
        })
        grid.api.setFilterModel(state.filter)
      })
  }

  private submitState(state: ColumnState[]) {
    const grid = this.sigGrid()
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
