import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Column, ColumnState } from 'ag-grid-community'
import { AgGridCommon } from 'ag-grid-community/dist/lib/interfaces/iCommon'
import { BehaviorSubject, combineLatest, defer, filter, firstValueFrom, map, switchMap, take } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { IconsModule } from '../icons'
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
} from '../icons/svg'
import { EditorDialogComponent } from '../layout'
import { DataTableAdapter } from './data-table-adapter'
import { TooltipModule } from '~/ui/tooltip'
import { QuicksearchModule, QuicksearchService } from '../quicksearch'
import { executeTypescript, transpileTypescript } from '../code-editor'

@Component({
  standalone: true,
  selector: 'nwb-data-table-panel',
  templateUrl: './data-table-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, DialogModule, TooltipModule, QuicksearchModule],
  providers: [QuicksearchService],
  host: {
    class: 'w-80 flex flex-col gap-1 bg-base-100 rounded-b-md',
  },
})
export class DataTablePanelComponent {
  protected grid = this.adapter.grid
  protected isFilterActive = this.adapter.isAnyFilterPresent$
  protected columns = this.grid
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

  protected displayCols = combineLatest({
    search: this.qs.query,
    cols: this.columns,
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

  protected get hasScriptFilterTemplate() {
    return this.adapter.scriptFilterTemplate
  }

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

  public constructor(private adapter: DataTableAdapter<any>, private dialog: Dialog, private qs: QuicksearchService) {
    //
  }

  protected async exportCsv() {
    const grid = await firstValueFrom(this.adapter.grid)
    //const data = grid.api.getDataAsCsv({})
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
    this.adapter.scriptFilter = null
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
    const grid = await firstValueFrom(this.adapter.grid)
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

  protected async openFilterCode() {
    EditorDialogComponent.open(this.dialog, {
      disableClose: true,
      data: {
        title: 'Custom Filter Script',
        value: this.adapter.scriptFilter || this.adapter.scriptFilterTemplate,
        readonly: false,
        language: 'typescript',
        positive: 'Close',
      },
    }).closed
      .pipe(take(1))
      .pipe(filter((it) =>  !!it))
      .subscribe((result) => {
        this.adapter.scriptFilter = result
        executeTypescript(result)
      })
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
