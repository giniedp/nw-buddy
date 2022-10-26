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
  SimpleChanges,
} from '@angular/core'
import { ColumnApi, ColumnState, GridApi, GridReadyEvent, Events } from 'ag-grid-community'
import { isEqual } from 'lodash'
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  debounceTime,
  defer,
  distinctUntilChanged,
  fromEvent,
  map,
  Observable,
  ReplaySubject,
  skip,
  Subject,
  subscribeOn,
  switchMap,
  takeUntil,
} from 'rxjs'
import { LocaleService } from '~/i18n'
import { PreferencesService, StorageNode } from '~/preferences'
import { AgGridModule } from '~/ui/ag-grid'
import { DestroyService, shareReplayRefCount } from '~/utils'
import { DataTableAdapter } from './data-table-adapter'

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

  @Output()
  public rowDoubleClick = new EventEmitter<any>()

  private gridApi: GridApi
  private colApi: ColumnApi

  public get gridData() {
    return this.displayItems$
  }

  protected gridOptions = defer(() => this.adapter$)
    .pipe(switchMap((adapter) => adapter.options))
    .pipe(
      map((options) => {
        return {
          suppressColumnMoveAnimation: true,
          rowHeight: 40,
          rowMultiSelectWithClick: true,
          suppressMenuHide: true,
          defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true,
          },
          onSelectionChanged: ({ api }) => {
            this.zone.run(() => {
              this.gridSelectionChanged$.next(api.getSelectedRows() || [])
            })
          },
          onRowDataChanged: () => {
            this.gridRowDataChanged$.next(null)
          },
          onFirstDataRendered: () => {
            this.gridRowDataChanged$.next(null)
            // this.loadFilterState()
          },
          onFilterChanged: () => {
            // this.saveFilterState()
          },
          onRowDoubleClicked: (e) => {
            this.rowDoubleClick.emit(this.adapter.entityID(e.data))
          },
          ...options,
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
  public categories = defer(() =>
    combineLatest({
      items: this.items$,
      adapter: this.adapter$,
    })
  ).pipe(
    map(({ items, adapter }) => {
      return Array.from(new Set(items.map((it) => adapter.entityCategory(it)).filter((it) => !!it)))
    })
  )

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
  private displayItems$ = defer(() =>
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
      return items.filter((it) => adapter.entityCategory(it) === category)
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
    this.gridStorage = preferences.session.storageScope('grid:')
    this.adapter$.next(adapter)
  }

  public async ngOnInit() {
    this.gridReady$.pipe(takeUntil(this.destroy.$)).subscribe((e) => {
      this.loadColumnState()
      this.adapter.setGrid(e)
    })

    this.mergeEvents([
      Events.EVENT_COLUMN_MOVED,
      Events.EVENT_COLUMN_PINNED,
      Events.EVENT_COLUMN_VISIBLE,
      Events.EVENT_COLUMN_RESIZED,
    ])
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.saveColumnState()
      })

    this.gridReady$
      .pipe(switchMap(() => this.locale.value$))
      .pipe(skip(1)) // skip initial value
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.gridApi.refreshCells({ force: true })
      })

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

    this.adapter$
      .pipe(switchMap(() => this.gridSelectionChanged$))
      .pipe(map((list) => list.map((it) => this.adapter.entityID(it))))
      .pipe(distinctUntilChanged<string[]>(isEqual))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((ids) => {
        this.select(ids)
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
        return new Observable((sub) => {
          function emit() {
            sub.next()
          }
          events.forEach((type) => api.addEventListener(type, emit))
          return () => {
            events.forEach((type) => api.removeEventListener(type, emit))
          }
        })
      })
    )
  }

  private getChange(ch: SimpleChanges, key: keyof this) {
    return ch[key as any]
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
    this.gridStorage.set(key, {
      ...(this.gridStorage.get(key) || {}),
      filter: api.getFilterModel(),
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
