import { AgGridEvent, GridApi, GridOptions } from '@ag-grid-community/core'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Optional,
  Output,
} from '@angular/core'
import { isEqual } from 'lodash'
import {
  NEVER,
  Observable,
  asyncScheduler,
  combineLatest,
  debounceTime,
  defer,
  map,
  merge,
  skip,
  subscribeOn,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { LocaleService } from '~/i18n'
import { AgGridDirective } from '~/ui/ag-grid'
import { debounceSync } from '~/utils/rx-operators'
import { gridDisplayRowCount } from '../ag-grid/utils'
import { DataGridFilterModelDirective } from './data-grid-filter-model.directive'
import { DataGridPersistenceService } from './data-grid-persistence.service'
import { DataTableRouterDirective } from './data-grid-route-param.directive'
import { DataGridSource } from './data-grid-source'
import { DataGridStore } from './data-grid.store'

export interface SelectionChangeEvent<T> {
  rows: T[]
  ids: Array<string | number>
}

@Component({
  standalone: true,
  selector: 'nwb-data-grid',
  exportAs: 'dataGrid',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridDirective],
  providers: [DataGridPersistenceService, DataGridStore],
  hostDirectives: [AgGridDirective, DataGridFilterModelDirective, DataTableRouterDirective],
  host: {
    class: 'flex-1 h-full w-full',
  },
})
export class DataGridComponent<T> implements OnInit {
  @Input()
  public set category(value: string) {
    this.store.patchState({ selectedCategory: value })
  }

  @Input()
  public set source(value: DataGridSource<T>) {
    this.store.patchState({ source: value })
  }

  @Input()
  public set filterParam(value: string) {
    this.store.patchState({ filterParam: value })
  }

  @Input()
  public set selectionParam(value: string) {
    this.store.patchState({ selectionParam: value })
  }

  @Input()
  public persistKey: string

  @Output()
  public readonly rowDoubleClicked$ = new EventEmitter<T>()

  @Output()
  public readonly selectionChanged$ = new EventEmitter<SelectionChangeEvent<T>>()

  @Output()
  public readonly ready$ = defer(() => this.grid.onReady)

  public readonly selection$ = defer(() => this.store.selectedItemIds$)
  public readonly categories$ = defer(() => this.store.categories$)
  public readonly rowCount$ = defer(() => gridDisplayRowCount(this.ready$))

  public constructor(
    private locale: LocaleService,
    private zone: NgZone,
    private grid: AgGridDirective<T>,
    private persistence: DataGridPersistenceService,
    private store: DataGridStore<T>,
    @Optional()
    source: DataGridSource<T>
  ) {
    if (source) {
      this.source = source
    }
  }

  public async ngOnInit() {
    this.attachBootloader()
    this.attachPersistence()
    this.attachAutoRefresh()
    this.attachSelectionBinding()

    // this.adapter.grid
    //   .pipe(switchMap(() => this.filter$))
    //   .pipe(takeUntil(this.store.destroy$))
    //   .subscribe((filter) => {
    //     this.applyFilterState(this.gridApi, filter)
    //   })

    // listen for transaction events and apply them to the grid
    // this.adapter$
    //   .pipe(switchMap((it) => it.transaction || NEVER))
    //   .pipe(takeUntil(this.store.destroy$))
    //   .subscribe((tx) => {
    //     this.gridApi.applyTransactionAsync(tx)
    //   })
  }

  private attachBootloader() {
    this.ready$.pipe(takeUntil(this.store.destroy$)).subscribe((grid) => {
      this.store.patchState({ grid: grid })
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
      .subscribe(({ api }) => {
        api.refreshCells({ force: true })
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

  private attachSelectionBinding() {
    // doubleClick$ = defer(() => this.grid.onEvent('rowDoubleClicked'))

    // pull selection from grid -> store
    this.withSource((source) => {
      return this.grid.onEvent('selectionChanged').pipe(
        map(({ api }) => {
          const rows = api.getSelectedRows()
          const ids = rows.map((it) => source.entityID(it))
          return {
            rows,
            ids,
          }
        })
      )
    })
      .pipe(takeUntil(this.store.destroy$))
      .subscribe(({ rows, ids }) => {
        this.store.patchState({ selectedItems: ids })
        this.selectionChanged$.emit({
          rows,
          ids,
        })
      })

    // sync selection from store -> grid
    combineLatest({
      source: this.store.source$,
      selection: this.store.selectedItemIds$,
      change: merge(this.grid.onEvent('firstDataRendered'), this.grid.onEvent('rowDataChanged')),
      grid: this.ready$,
    })
      .pipe(subscribeOn(asyncScheduler))
      .pipe(takeUntil(this.store.destroy$))
      .subscribe(({ source, selection, grid }) => {
        this.syncSelection({
          source,
          toSelect: selection,
          ensureVisible: true,
          api: grid.api,
        })
      })
  }

  private syncSelection({
    source,
    toSelect,
    api,
    ensureVisible,
  }: {
    source: DataGridSource<T>
    toSelect: Array<string | number>
    api: GridApi
    ensureVisible?: boolean
  }) {
    if (!api || !source) {
      return
    }

    if (
      isEqual(
        toSelect,
        api.getSelectedRows().map((it) => source.entityID(it))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(source.entityID(it.data))) {
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

  private withSource<O>(fn: (source: DataGridSource<T>) => Observable<O>) {
    return this.store.source$.pipe(
      switchMap((source) => {
        if (!source) {
          return NEVER
        }
        return fn(source)
      })
    )
  }
}

const OVERLAY_LOADING = `<button class="btn btn-square btn-ghost loading"></button>`
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
  }
}
