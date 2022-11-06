import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
} from '@angular/core'
import { ColumnApi, ColumnState, Events, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { isEqual } from 'lodash'
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  debounceTime,
  defer,
  distinctUntilChanged,
  map,
  merge,
  NEVER,
  Observable,
  ReplaySubject,
  skip,
  Subject,
  subscribeOn,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { LocaleService } from '~/i18n'
import { PreferencesService, StorageNode } from '~/preferences'
import { AgGridModule, fromGridEvent } from '~/ui/ag-grid'
import { DestroyService, shareReplayRefCount } from '~/utils'
import { DataTableAdapter, DataTableCategory } from './data-table-adapter'

@Component({
  standalone: true,
  selector: 'nwb-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AgGridModule],
  providers: [DestroyService],
  host: {
    class: 'layout-col overflow-clip',
  },
})
export class DataTableComponent<T> implements OnInit, OnChanges, OnDestroy {
  @Input()
  public quickFilter: string

  @Input()
  public persistStateId: string

  @Input()
  public multiSelect: boolean

  @Output()
  public rowDoubleClick = new EventEmitter<any>()

  private gridApi: GridApi
  private colApi: ColumnApi

  public get gridData() {
    return this.categoryItems$
  }

  protected gridOptions = defer(() => this.adapter$)
    .pipe(switchMap((adapter) => adapter.options))
    .pipe(
      map((options): GridOptions<T> => {
        return {
          ...options,
          suppressColumnMoveAnimation: true,
          rowHeight: options.rowHeight ?? 56,
          rowSelection: this.multiSelect ? 'multiple' : options.rowSelection || 'single',
          suppressMenuHide: true,
          overlayLoadingTemplate:
            options.overlayLoadingTemplate ??
            `
            <button class="btn btn-square btn-ghost loading"></button>
          `,
          overlayNoRowsTemplate:
            options.overlayNoRowsTemplate ??
            `
          <div class="alert shadow-lg max-w-[300px]">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>No rows to show</span>
            </div>
          </div>
          `,
          defaultColDef: options.defaultColDef ?? {
            resizable: true,
            sortable: true,
            filter: true,
          },
          onSelectionChanged: (params) => {
            options.onSelectionChanged?.(params)
            this.zone.run(() => {
              this.gridSelectionChanged$.next(params.api.getSelectedRows() || [])
            })
          },
          onRowDataChanged: (params) => {
            options.onRowDataChanged?.(params)
            this.gridRowDataChanged$.next(null)
          },
          onFirstDataRendered: (params) => {
            options.onFirstDataRendered?.(params)
            this.gridRowDataChanged$.next(null)
            // this.loadFilterState()
          },
          onFilterChanged: (params) => {
            options.onFilterChanged?.(params)
            // this.saveFilterState()
          },
          onRowDoubleClicked: (params) => {
            options.onRowDoubleClicked?.(params)
            this.rowDoubleClick.emit(this.adapter.entityID(params.data))
          },
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  @Output()
  public get selection(): Observable<string[]> {
    return this.selection$
  }

  @Output()
  public get selectedItems(): Observable<T[]> {
    return this.gridSelectionChanged$
  }

  @Output()
  public get selectedItem(): Observable<T> {
    return this.gridSelectionChanged$.pipe(map((it) => it?.[0]))
  }

  @Output()
  public categories = defer(() => this.adapter$).pipe(switchMap((adapter) => (adapter ? adapter.categories : [])))

  @Input()
  public set adapter(value: DataTableAdapter<T>) {
    this.adapter$.next(value)
  }
  public get adapter() {
    return this.adapter$.value
  }

  protected get persistKey() {
    return this.persistStateId || this.adapter?.persistStateId
  }

  private adapter$ = new BehaviorSubject<DataTableAdapter<T>>(null)
  private gridReady$ = new ReplaySubject<GridReadyEvent>(1)
  private gridSelectionChanged$ = new ReplaySubject<T[]>(1)
  private gridRowDataChanged$ = new Subject()
  private selection$ = new ReplaySubject<string[]>(1)
  private items$ = defer(() => this.adapter$).pipe(switchMap((adapter) => adapter.entities))
  private category$ = defer(() => this.adapter$).pipe(switchMap((adapter) => adapter.category))
  private categoryItems$ = defer(() =>
    combineLatest({
      adapter: this.adapter$,
      items: this.items$,
      category: this.category$,
    })
  ).pipe(
    map(({ adapter, items, category }) => {
      if (!category) {
        return items
      }
      return items.filter((it) => intersectsCategory(adapter.entityCategory(it), category))
    })
  )

  private gridStorage: StorageNode<{ columns?: any; filter?: any }>

  public constructor(
    private locale: LocaleService,
    private cdRef: ChangeDetectorRef,
    private zone: NgZone,
    private destroy: DestroyService,
    @Optional()
    adapter: DataTableAdapter<T>,
    preferences: PreferencesService
  ) {
    this.gridStorage = preferences.storage.storageScope('grid:')
    if (adapter) {
      this.adapter$.next(adapter)
    }
  }

  public async ngOnInit() {
    // bind grid instance when it is ready
    this.gridReady$.pipe(takeUntil(this.destroy.$)).subscribe((e) => {
      this.loadColumnState()
      this.loadFilterState()
      this.adapter.setGrid(e)
    })

    // save column state whenever a column has changed
    this.mergeEvents([
      Events.EVENT_COLUMN_MOVED,
      Events.EVENT_COLUMN_PINNED,
      Events.EVENT_COLUMN_VISIBLE,
      Events.EVENT_COLUMN_RESIZED,
      Events.EVENT_SORT_CHANGED,
    ])
      .pipe(debounceTime(500))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.saveColumnState()
      })

    // save filter state whenever a filter has changed
    this.mergeEvents([Events.EVENT_FILTER_CHANGED])
      .pipe(debounceTime(500))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.saveFilterState()
      })

    // refresh cells whenever the language has changed
    this.gridReady$
      .pipe(switchMap(() => this.locale.value$))
      .pipe(skip(1)) // skip initial value
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.gridApi.refreshCells({ force: true })
      })

    // sync selection state between grid and this instance
    combineLatest({
      selection: this.selection$.pipe(distinctUntilChanged<string[]>(isEqual)),
      change: this.gridRowDataChanged$,
      ready: this.gridReady$,
    })
      .pipe(subscribeOn(asyncScheduler))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ selection }) => {
        this.syncSelection(selection, {
          ensureVisible: true,
        })
      })

    // delegate select event from grid to this instance
    this.adapter$
      .pipe(switchMap(() => this.gridSelectionChanged$))
      .pipe(map((list) => list.map((it) => this.adapter.entityID(it))))
      .pipe(distinctUntilChanged<string[]>(isEqual))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((ids) => {
        this.select(ids)
      })

    // delegate select event from adapter to this instance
    this.adapter$
      .pipe(switchMap((it) => it.select))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((toSelect) => {
        this.select(toSelect)
      })

    // listen for transaction events and apply them to the grid
    this.adapter$
      .pipe(switchMap((it) => it.transaction || NEVER))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((tx) => {
        this.gridApi.applyTransactionAsync(tx)
      })
  }

  public ngOnChanges() {
    this.cdRef.markForCheck()
  }

  public ngOnDestroy() {
    //
  }

  public onGridReady(e: GridReadyEvent) {
    this.gridApi = e.api
    this.colApi = e.columnApi
    this.gridReady$.next(e)
  }

  public setCategory(category: string) {
    this.adapter.category.next(category)
  }

  private mergeEvents(events: string[]) {
    return this.gridReady$.pipe(
      switchMap(({ api }) => {
        return merge(...events.map((event) => {
          return fromGridEvent(api, event)
        }))
      })
    )
  }

  public select(ids: string[]) {
    this.zone.run(() => {
      this.selection$.next(ids)
    })
  }

  private syncSelection(toSelect: Array<string | number>, options?: { ensureVisible: boolean }) {
    const api = this.gridApi
    if (!api) {
      return
    }
    if (
      isEqual(
        toSelect,
        api.getSelectedRows().map((it) => this.adapter.entityID(it))
      )
    ) {
      return
    }
    api.forEachNode((it) => {
      if (toSelect && toSelect.includes(this.adapter.entityID(it.data))) {
        it.setSelected(true, false, true)
      } else if (it.isSelected()) {
        it.setSelected(false, false, true)
      }
    })
    if (options?.ensureVisible) {
      const selectedNode = api.getSelectedNodes()?.[0]
      if (selectedNode) {
        api.ensureNodeVisible(selectedNode, 'middle')
      }
    }
  }

  public resetColumnState() {
    this.colApi.resetColumnState()
    this.writeColumnState(null)
  }

  public saveColumnState() {
    const key = this.persistKey
    const api = this.colApi
    if (!key || !api) {
      return
    }
    const state = api.getColumnState()
    this.writeColumnState(state)
  }

  private writeColumnState(state: ColumnState[]) {
    const key = this.persistKey
    const api = this.colApi
    if (!key || !api) {
      return
    }
    const data = {
      ...(this.gridStorage.get(key) || {}),
    }
    if (state?.length) {
      data.columns = state
    } else {
      delete data.columns
    }
    this.gridStorage.set(key, data)
  }

  private saveFilterState() {
    const key = this.persistKey
    const api = this.gridApi
    if (!key || !api) {
      return
    }
    const filterState = api.getFilterModel()
    this.gridStorage.set(key, {
      ...(this.gridStorage.get(key) || {}),
      filter: filterState,
    })
  }

  private loadColumnState() {
    const key = this.persistKey
    const api = this.colApi
    if (!key || !api) {
      return
    }
    const data = this.gridStorage.get(key)?.columns
    if (data) {
      api.applyColumnState({ state: data, applyOrder: true })
    }
  }

  private loadFilterState() {
    const key = this.persistKey
    const api = this.gridApi
    if (!key || !api) {
      return
    }
    const data = this.gridStorage.get(key)?.filter
    if (data) {
      api.setFilterModel(data)
    }
  }
}

function intersectsCategory(catSet: string | DataTableCategory | Array<string | DataTableCategory>, category: string) {
  if (Array.isArray(catSet)) {
    return catSet.some((it) => (typeof it !== 'string' ? it.value : it) === category)
  }
  if (catSet) {
    return (typeof catSet !== 'string' ? catSet.value : catSet) === category
  }
  return false
}
