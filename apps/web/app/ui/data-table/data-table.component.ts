import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  OnChanges,
  OnDestroy,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  SimpleChanges,
  NgZone,
  Optional,
} from '@angular/core'
import { isEqual } from 'lodash'
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  defer,
  delay,
  distinctUntilChanged,
  map,
  Observable,
  ReplaySubject,
  startWith,
  Subject,
  subscribeOn,
  switchMap,
  switchMapTo,
  takeUntil,
  tap,
} from 'rxjs'
import { LocaleService } from '~/i18n'
import { PreferencesService, StorageNode } from '~/preferences'
import { DestroyService } from '~/utils'
import { AgGridComponent, AgGridModule } from '~/ui/ag-grid'
import { DataTableAdapter } from './data-table-adapter'
import { CommonModule } from '@angular/common'

@Component({
  standalone: true,
  selector: 'nwb-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AgGridModule],
  providers: [DestroyService],
})
export class DataTableComponent<T> implements OnInit, OnChanges, OnDestroy {
  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  @Input()
  public quickFilter: string

  @Input()
  public stateKey: string

  public get gridData() {
    return this.displayItems$
  }

  protected gridOptions = defer(() => this.adapter$).pipe(
    map((adapter) =>
      adapter.buildGridOptions({
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
      })
    )
  )

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

  private adapter$ = new BehaviorSubject<DataTableAdapter<T>>(null)
  private gridReady$ = new ReplaySubject(1)
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
    preferences: PreferencesService,
    @Optional()
    adapter: DataTableAdapter<T>
  ) {
    this.gridStorage = preferences.session.storageScope('grid:')
    this.adapter$.next(adapter)
  }

  public async ngOnInit() {
    this.gridReady$
      .pipe(switchMap(() => this.locale.value$))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.grid.api.refreshCells({ force: true })
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

  public ngOnChanges(changes: SimpleChanges) {
    this.cdRef.markForCheck()
  }

  public ngOnDestroy() {
    this.saveColumnState()
  }

  public onGridReady() {
    this.gridReady$.next(null)
    this.loadColumnState()
  }

  public setCategory(category: string) {
    this.adapter.category.next(category)
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
    const api = this.grid?.api
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

  private saveColumnState() {
    const key = this.stateKey
    const api = this.grid.colApi
    if (!key || !api) {
      return
    }
    this.gridStorage.set(key, {
      ...(this.gridStorage.get(key) || {}),
      columns: api.getColumnState(),
    })
  }

  private saveFilterState() {
    const key = this.stateKey
    const api = this.grid.api
    if (!key || !api) {
      return
    }
    this.gridStorage.set(key, {
      ...(this.gridStorage.get(key) || {}),
      filter: api.getFilterModel(),
    })
  }

  private loadColumnState() {
    const key = this.stateKey
    const api = this.grid.colApi
    if (!key || !api) {
      return
    }
    const data = this.gridStorage.get(key)?.columns
    if (data) {
      api.applyColumnState({ state: data })
    }
  }

  private loadFilterState() {
    const key = this.stateKey
    const api = this.grid.api
    if (!key || !api) {
      return
    }
    const data = this.gridStorage.get(key)?.filter
    if (data) {
      api.setFilterModel(data)
    }
  }
}
