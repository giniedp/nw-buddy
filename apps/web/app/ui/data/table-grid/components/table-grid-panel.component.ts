import { Column, ColumnState } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core'

import { toSignal } from '@angular/core/rxjs-interop'
import { ToastController } from '@ionic/angular/standalone'
import { ComponentStore } from '@ngrx/component-store'
import { BehaviorSubject, combineLatest, filter, firstValueFrom, map, switchMap, tap } from 'rxjs'
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
  svgFilterCircleXmark,
  svgFloppyDisk,
  svgFloppyDiskArrow,
  svgLink,
  svgThumbtack,
} from '~/ui/icons/svg'
import { LayoutModule, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'
import { gridStateToQueryParams } from '../table-grid-persistence.service'
import { ExportDialogComponent } from './export-dialog.component'
import { LoadStateDialogComponent } from './load-state-dialog.component'
import { SaveStateDialogComponent } from './save-state-dialog.component'

@Component({
  standalone: true,
  selector: 'nwb-table-grid-panel',
  templateUrl: './table-grid-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, TooltipModule, QuicksearchModule, LayoutModule],
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

  @Output()
  public close = new EventEmitter()

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
      tap(({ api }) => this.colState.next(api.getColumnState())),
      switchMap((grid) => {
        return this.colState.pipe(
          map((state) => {
            return state.map((it) => {
              return {
                ...it,
                name: this.getHeaderName(grid, grid.api.getColumn(it.colId)),
              }
            })
          }),
        )
      }),
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
    }),
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
  protected svgLink = svgLink

  private toast = inject(ToastController)

  public constructor(
    private modal: ModalService,
    private qs: QuicksearchService,
  ) {
    super({ grid: null, persistKey: null })
  }

  protected sizeToFit() {
    const grid = this.sigGrid()
    grid?.api.sizeColumnsToFit(900)
  }

  protected autosizeColumns() {
    const grid = this.sigGrid()
    grid?.api.autoSizeAllColumns()
  }

  protected resetColumns() {
    const grid = this.sigGrid()
    grid?.api.resetColumnState()
    this.colState.next(grid.api.getColumnState())
  }

  protected resetFilter() {
    const grid = this.sigGrid()
    grid.api.setFilterModel({})
    grid.api.setGridOption('quickFilterText', '')
  }

  protected clearPins() {
    const grid = this.sigGrid()
    grid.api.setGridOption('pinnedTopRowData', [])
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

  protected saveState() {
    this.close.emit()
    const grid = this.sigGrid()
    const key = this.sigPersistKey()
    SaveStateDialogComponent.open(this.modal, {
      inputs: {
        title: 'Save State',
        key: key,
        data: {
          columns: grid.api.getColumnState(),
          filter: grid.api.getFilterModel(),
        },
      },
    })
  }

  protected loadState() {
    this.close.emit()
    LoadStateDialogComponent.open(this.modal, {
      inputs: {
        title: 'Load State',
        key: this.get(({ persistKey }) => persistKey),
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe((state) => {
        const grid = this.get(({ grid }) => grid)
        grid.api.applyColumnState({
          state: state.columns,
          applyOrder: true,
        })
        grid.api.setFilterModel(state.filter)
      })
  }

  protected copyURL() {
    this.close.emit()
    const grid = this.sigGrid()
    const params = gridStateToQueryParams(grid.api)
    const url = new URL(window.location.href)
    for (const key in params) {
      url.searchParams.set(key, params[key])
    }
    navigator.clipboard.writeText(url.toString())
    this.toast
      .create({
        message: 'Link was copied to clipboard',
        duration: 2000,
        position: 'top',
      })
      .then((toast) => toast.present())
  }

  protected openExporter() {
    this.close.emit()
    ExportDialogComponent.open(this.modal, {
      inputs: {
        title: 'CSV Export',
        grid: this.get(({ grid }) => grid.api),
      },
    })
  }

  private submitState(state: ColumnState[]) {
    const grid = this.sigGrid()
    grid.api.applyColumnState({
      state: state,
    })
    this.colState.next(grid.api.getColumnState())
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
