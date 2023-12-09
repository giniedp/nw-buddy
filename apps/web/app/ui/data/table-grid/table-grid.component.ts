import { AgGridEvent, GridApi, GridOptions, RowClickedEvent } from '@ag-grid-community/core'
import { animate, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core'
import { isEqual } from 'lodash'
import {
  ReplaySubject,
  asyncScheduler,
  combineLatest,
  debounceTime,
  defer,
  filter,
  map,
  merge,
  skip,
  subscribeOn,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { LocaleService } from '~/i18n'
import { AgGrid, AgGridDirective } from '~/ui/data/ag-grid'
import { gridDisplayRowCount, gridGetPinnedTopData } from '~/ui/data/ag-grid/utils'
import { runInZone } from '~/utils/rx/run-in-zone'
import { debounceSync, selectStream, tapDebug } from '~/utils'
import { TableGridPersistenceService } from './table-grid-persistence.service'
import { TableGridStore } from './table-grid.store'

export interface SelectionChangeEvent<T> {
  rows: T[]
  ids: Array<string | number>
}

@Component({
  standalone: true,
  selector: 'nwb-table-grid',
  exportAs: 'tableGrid',
  templateUrl: './table-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AgGridDirective],
  providers: [TableGridPersistenceService, TableGridStore],
  host: {
    class: 'flex-1 h-full w-full relative',
  },
  animations: [
    trigger('fade', [
      transition(':leave', [style({ opacity: 1 }), animate('0.150s 0.3s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class TableGridComponent<T> implements OnInit {
  @Input()
  public set data(value: T[]) {
    this.store.patchState({ gridData: value })
  }

  @Input()
  public set options(value: GridOptions<T>) {
    this.store.patchState({ gridOptions: value })
  }

  @Input()
  public set selection(value: Array<string | number>) {
    this.store.patchState({ selection: value })
  }

  @Input()
  public set identifyBy(value: (it: T) => string | number) {
    this.store.patchState({ identifyBy: value })
  }

  @Input()
  public persistKey: string

  @Output()
  public readonly rowDoubleClicked$ = new EventEmitter<T>()

  @Output()
  public readonly selectionChanged$ = new EventEmitter<SelectionChangeEvent<T>>()

  @Output()
  public readonly pinnedChanged$ = new EventEmitter<SelectionChangeEvent<T>>()

  @Output()
  public readonly ready$ = new ReplaySubject<AgGrid<T>>(1)

  @Output()
  public readonly selection$ = defer(() => this.store.selection$)

  @Output()
  public readonly selectedRows$ = selectStream(defer(() => this.selectionChanged$).pipe(map((it) => it.rows)))

  @Output()
  public readonly selectedRow$ = selectStream(defer(() => this.selectionChanged$).pipe(map((it) => it.rows?.[0])))

  @Output()
  public readonly pinnedRows$ = selectStream(defer(() => this.pinnedChanged$).pipe(map((it) => it.rows)))

  @ViewChild(AgGridDirective, { static: true })
  public readonly grid: AgGridDirective<T>

  public readonly rowCount$ = defer(() => gridDisplayRowCount(this.ready$))

  public constructor(
    private locale: LocaleService,
    //private grid: AgGridDirective<T>,
    private persistence: TableGridPersistenceService,
    protected store: TableGridStore<T>,
    private zone: NgZone
  ) {
    //
  }

  public async ngOnInit() {
    this.grid.onReady.pipe(takeUntil(this.store.destroy$)).subscribe(this.ready$)
    this.attachBootloader()
    this.attachPersistence()
    this.attachPinBinding()
    this.attachAutoRefresh()
    this.attachSelectionBinding()
  }

  private attachBootloader() {
    this.ready$.pipe(takeUntil(this.store.destroy$)).subscribe((grid) => {
      this.store.patchState({ grid: grid, hasLoaded: true })
    })
    // grid initialization
    combineLatest({
      data: this.store.gridData$,
      options: this.store.gridOptions$.pipe(map(selectGridOptions)),
    })
      .pipe(debounceSync())
      .pipe(takeUntil(this.store.destroy$))
      .subscribe(({ data, options }) => {
        this.grid.gridData = data
        this.grid.gridOptions = options
      })
  }

  private attachAutoRefresh() {
    this.ready$
      .pipe(
        switchMap((it) => {
          return this.locale.value$.pipe(map(() => it))
        })
      )
      .pipe(skip(1)) // skip initial value
      .pipe(takeUntil(this.store.destroy$))
      .subscribe(({ api, columnApi }) => {
        // force re-render with new locale
        api.refreshCells({ force: true })
        // force quick filter cache reset
        api.resetQuickFilter()
        // force column filter cache reset
        columnApi.getColumns().forEach((it) => {
          api.destroyFilter(it.getColId())
        })
      })
  }

  private attachPersistence() {
    merge(
      // load column and filter state
      this.ready$.pipe(
        tap(({ columnApi, api }) => {
          this.persistence.loadColumnState(columnApi, this.persistKey)
          this.persistence.loadFilterState(api, this.persistKey)
        })
      ),
      // load pinned data state
      merge(this.grid.onEvent('firstDataRendered'), this.grid.onEvent('rowDataChanged')).pipe(
        tap(({ api }) => {
          this.persistence.loadPinnedState(api, this.persistKey, this.store.identifyBy$())
        })
      ),
      // save pinned data state
      this.grid
        .onEvent('pinnedRowDataChanged')
        .pipe(debounceTime(500))
        .pipe(
          tap(({ api }) => {
            this.persistence.savePinnedState(api, this.persistKey, this.store.identifyBy$())
          })
        ),
      // save column state whenever a column has changed
      merge(
        this.grid.onEvent('columnMoved'),
        this.grid.onEvent('columnPinned'),
        this.grid.onEvent('columnVisible'),
        this.grid.onEvent('columnResized'),
        this.grid.onEvent('sortChanged')
      )
        .pipe(debounceTime(500))
        .pipe(
          tap(({ columnApi }: AgGridEvent) => {
            this.persistence.saveColumnState(columnApi, this.persistKey)
          })
        ),
      // save filter state whenever a filter has changed
      this.grid
        .onEvent('filterChanged')
        .pipe(debounceTime(500))
        .pipe(
          tap(({ api }: AgGridEvent) => {
            this.persistence.saveFilterState(api, this.persistKey)
          })
        )
    )
      .pipe(takeUntil(this.store.destroy$))
      .subscribe()
  }

  private attachPinBinding() {
    this.grid
      .onEvent('pinnedRowDataChanged')
      .pipe(runInZone(this.zone))
      .pipe(
        tap(({ api }) => {
          const identifyBy = this.store.identifyBy$()
          const rows = gridGetPinnedTopData(api)
          const ids = identifyBy ? rows.map(identifyBy) : null
          this.store.patchState({ pinned: ids })
        })
      )
      .pipe(takeUntil(this.store.destroy$))
      .subscribe()

    this.grid
      .onEvent('rowClicked')
      .pipe(filter((it: RowClickedEvent) => !!it.rowPinned))
      .pipe(takeUntil(this.store.destroy$))
      .subscribe((e: RowClickedEvent) => {
        e.api.forEachNode((it) => {
          if (it.data === e.data) {
            it.setSelected(true, true, 'api')
            e.api.ensureNodeVisible(it, 'middle')
          }
        })
      })
  }

  private attachSelectionBinding() {
    this.grid
      .onEvent('rowDoubleClicked')
      .pipe(filter((it: RowClickedEvent) => !it.rowPinned))
      .pipe(takeUntil(this.store.destroy$))
      .subscribe((e: RowClickedEvent) => {
        this.rowDoubleClicked$.emit(e.data)
      })

    // pull selection from grid -> store
    this.grid
      .onEvent('selectionChanged')
      .pipe(runInZone(this.zone))
      .pipe(
        tap(({ api }) => {
          const identifyBy = this.store.identifyBy$()
          const rows = api.getSelectedRows()
          const ids = identifyBy ? rows.map(identifyBy) : null
          this.store.patchState({ selection: ids })
          this.selectionChanged$.emit({
            rows,
            ids,
          })
        })
      )
      .pipe(takeUntil(this.store.destroy$))
      .subscribe()

    // sync selection from store -> grid
    combineLatest({
      selection: this.store.selection$,
      change: merge(this.grid.onEvent('firstDataRendered'), this.grid.onEvent('rowDataChanged')),
      grid: this.ready$,
    })
      .pipe(subscribeOn(asyncScheduler))
      .pipe(runInZone(this.zone))
      .pipe(takeUntil(this.store.destroy$))
      .subscribe(({ selection, grid }) => {
        this.syncSelection({
          toSelect: selection,
          ensureVisible: true,
          api: grid.api,
        })
      })
  }

  private syncSelection({
    toSelect,
    api,
    ensureVisible,
  }: {
    toSelect: Array<string | number>
    api: GridApi
    ensureVisible?: boolean
  }) {
    const identifyBy = this.store.identifyBy$()
    if (!api || !identifyBy) {
      return
    }

    if (isEqual(toSelect, api.getSelectedRows().map(identifyBy))) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(identifyBy(it.data))) {
        it.setSelected(true, false, 'api')
      } else if (it.isSelected()) {
        it.setSelected(false, false, 'api')
      }
    })
    const selectedNode = api.getSelectedNodes()?.[0]
    if (ensureVisible && selectedNode) {
      api.ensureNodeVisible(selectedNode, 'middle')
    }
  }

  private syncPinned({ toPin, api }: { toPin: Array<string | number>; api: GridApi }) {
    const identifyBy = this.store.identifyBy$()
    if (!api || !identifyBy) {
      return
    }

    const dataToPin = []
    api.forEachNode((it) => {
      if (toPin && toPin.includes(identifyBy(it.data))) {
        dataToPin.push(it.data)
      }
    })
    api.setPinnedTopRowData(dataToPin)
  }
}

//const OVERLAY_LOADING = `<button class="btn btn-square btn-ghost loading"></button>`
const OVERLAY_LOADING = `<div></div>`
const OVERLAY_NO_ROWS = `
  <div class="alert shadow-lg max-w-[300px]">
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info flex-shrink-0 w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>No rows to show</span>
    </div>
  </div>
`

function selectGridOptions(options: GridOptions) {
  options = options || {}
  return {
    ...options,
    suppressColumnMoveAnimation: true,
    rowBuffer: options.rowBuffer ?? 0,
    rowHeight: options.rowHeight ?? 56,
    headerHeight: options.headerHeight ?? 32,
    rowSelection: options.rowSelection ?? 'single',
    enableCellTextSelection: options.enableCellTextSelection ?? true,
    suppressMenuHide: options.suppressMenuHide ?? true,
    overlayLoadingTemplate: options.overlayLoadingTemplate ?? OVERLAY_LOADING,
    overlayNoRowsTemplate: options.overlayNoRowsTemplate ?? OVERLAY_NO_ROWS,
    defaultColDef: options.defaultColDef ?? {
      resizable: true,
      sortable: true,
      filter: true,
    },
    includeHiddenColumnsInQuickFilter: options.includeHiddenColumnsInQuickFilter ?? true,
    cacheQuickFilter: true
  } satisfies GridOptions
}
