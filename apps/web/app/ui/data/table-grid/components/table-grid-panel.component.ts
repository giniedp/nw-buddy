import { Column, ColumnState } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core'

import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ToastController } from '@ionic/angular/standalone'
import { BehaviorSubject, combineLatest, filter, map, switchMap, tap } from 'rxjs'
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
import { injectWindow } from '~/utils/injection/window'
import { gridStateToQueryParams } from '../table-grid-persistence.service'
import { ExportDialogComponent } from './export-dialog.component'
import { LoadStateDialogComponent } from './load-state-dialog.component'
import { SaveStateDialogComponent } from './save-state-dialog.component'

export interface TableGridActionButton {
  icon: string
  label: string
  description: string
  action: (grid: AgGrid) => void
}

@Component({
  selector: 'nwb-table-grid-panel',
  templateUrl: './table-grid-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IconsModule, TooltipModule, QuicksearchModule, LayoutModule],
  providers: [QuicksearchService],
  host: {
    class: 'flex flex-col gap-1 h-full overflow-hidden',
  },
})
export class TableGridPanelComponent {
  public grid = input<AgGrid>()
  public persistKey = input<string>()
  public actions = input<TableGridActionButton[]>()
  public close = output<void>()

  private window = injectWindow()
  private grid$ = toObservable(this.grid)
  private state = computed(() => {
    const state = this.grid()?.api?.getColumnState()
    return {
      columns: signal<ColumnState[]>(state || []),
    }
  })

  protected showColumns = signal<boolean>(false)
  protected columns = computed(() => {
    const grid = this.grid()
    const cols = this.state().columns()
    return cols.map((it) => {
      return {
        ...it,
        name: this.getHeaderName(grid, grid.api.getColumn(it.colId)),
      }
    })
  })
  protected isAnyColumnVisible = computed(() => {
    return !!this.columns().find((it) => !it.hide)
  })
  protected isAnyColumnHidden = computed(() => {
    return !!this.columns().find((it) => !!it.hide)
  })
  protected isFilterActive$ = toSignal(gridHasAnyFilterPresent(this.grid$), {
    initialValue: false,
  })

  private filterQuery = toSignal(this.qs.query$)
  protected displayedCols = computed(() => {
    const search = this.filterQuery()?.toLowerCase()
    const cols = this.columns()
    if (!search) {
      return cols
    }
    return cols.filter((it) => {
      return it.colId?.toLowerCase()?.includes(search) || it.name?.toLowerCase()?.includes(search)
    })
  })

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
    //
  }

  protected sizeToFit() {
    this.grid()?.api.sizeColumnsToFit(900)
  }

  protected autosizeColumns() {
    this.grid()?.api.autoSizeAllColumns()
  }

  protected resetColumns() {
    const api = this.grid()?.api
    if (api) {
      api.resetColumnState()
      this.state().columns.set(api.getColumnState())
    }
  }

  protected resetFilter() {
    const api = this.grid()?.api
    if (api) {
      api.setFilterModel({})
      api.setGridOption('quickFilterText', '')
    }
  }

  protected clearPins() {
    const api = this.grid()?.api
    if (api) {
      api.setGridOption('pinnedTopRowData', [])
    }
  }

  protected setAllHidden(hidden: boolean) {
    const state = this.state()
      .columns()
      .map((it) => {
        it.hide = hidden
        return it
      })
    this.submitState(state)
  }

  protected toggleHide(id: string) {
    const state = this.state()
      .columns()
      .map((it) => {
        if (it.colId === id) {
          it.hide = !it.hide
        }
        return it
      })
    this.submitState(state)
  }

  protected togglePinLeft(id: string) {
    const state = this.state()
      .columns()
      .map((it) => {
        if (it.colId === id) {
          it.pinned = it.pinned === 'left' ? false : 'left'
        }
        return it
      })
    this.submitState(state)
  }

  protected togglePinRight(id: string) {
    const state = this.state()
      .columns()
      .map((it) => {
        if (it.colId === id) {
          it.pinned = it.pinned === 'right' ? false : 'right'
        }
        return it
      })
    this.submitState(state)
  }

  protected saveState() {
    this.close.emit()
    const grid = this.grid()
    const key = this.persistKey()
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
        key: this.persistKey(),
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe((state) => {
        const grid = this.grid()
        grid.api.applyColumnState({
          state: state.columns,
          applyOrder: true,
        })
        grid.api.setFilterModel(state.filter)
      })
  }

  protected copyURL() {
    this.close.emit()
    const grid = this.grid()
    const params = gridStateToQueryParams(grid.api)
    const url = new URL(this.window.location.href)
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
        grid: this.grid()?.api,
      },
    })
  }

  protected handleAction(action: TableGridActionButton) {
    action.action(this.grid())
    this.close.emit()
  }

  private submitState(state: ColumnState[]) {
    const api = this.grid()?.api
    if (api) {
      api.applyColumnState({ state: state })
      this.state().columns.set(api.getColumnState())
    }
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
