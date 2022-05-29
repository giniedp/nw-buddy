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
} from '@angular/core'
import { GridOptions } from 'ag-grid-community'
import { isEqual } from 'lodash'
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  map,
  Observable,
  ReplaySubject,
  Subject,
  switchMap,
  switchMapTo,
  takeUntil,
} from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { PreferencesService, StorageNode } from '~/core/preferences'
import { DestroyService } from '~/core/utils'
import { AgGridComponent } from '~/ui/ag-grid'
import { DataTableAdapter } from './data-table-adapter'

@Component({
  selector: 'nwb-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  public gridOptions: GridOptions = this.adapter.buildGridOptions({
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
      // this.loadFilterState()
    },
    onFilterChanged: () => {
      // this.saveFilterState()
    },
  })

  @Output()
  public get selection(): Observable<string[]> {
    return this.selection$
  }

  @Output()
  public get selectedItems(): Observable<T[]> {
    return this.gridSelectionChanged$
  }

  @Output()
  public categories = defer(() => this.items$).pipe(
    map((items) => {
      return Array.from(new Set(items.map((it) => this.adapter.entityCategory(it)).filter((it) => !!it)))
    })
  )

  private gridReady$ = new ReplaySubject(1)
  private gridSelectionChanged$ = new ReplaySubject<T[]>(1)
  private gridRowDataChanged$ = new Subject()
  private selection$ = new ReplaySubject<string[]>(1)
  private items$ = defer(() => this.adapter.entities)
  private displayItems$ = defer(() =>
    combineLatest({
      items: this.items$,
      category: this.adapter.category,
    })
  ).pipe(
    map(({ items, category }) => {
      if (!category) {
        return items
      }
      return items.filter((it) => this.adapter.entityCategory(it) === category)
    })
  )

  private gridStorage: StorageNode<{ columns?: any; filter?: any }>

  public constructor(
    private locale: LocaleService,
    private cdRef: ChangeDetectorRef,
    private adapter: DataTableAdapter<T>,
    private zone: NgZone,
    private destroy: DestroyService,
    preferences: PreferencesService
  ) {
    this.gridStorage = preferences.session.storageScope('grid:')
  }

  public async ngOnInit() {
    this.gridReady$
      .pipe(switchMapTo(this.locale.value$))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.grid.api.refreshCells({ force: true })
      })

    combineLatest({
      selection: this.selection$.pipe(distinctUntilChanged<string[]>(isEqual)),
      change: this.gridRowDataChanged$,
      ready: this.gridReady$,
    })
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ selection }) => {
        this.syncSelection(selection, {
          ensureVisible: true,
        })
      })

    this.gridSelectionChanged$
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

  private syncSelection(toSelect: string[], options?: { ensureVisible: boolean }) {
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
