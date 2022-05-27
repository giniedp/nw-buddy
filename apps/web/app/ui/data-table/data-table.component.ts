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
import { BehaviorSubject, combineLatest, defer, filter, map, takeUntil } from 'rxjs'
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
  providers: [DestroyService]
})
export class DataTableComponent<T> implements OnInit, OnChanges, OnDestroy {

  @ViewChild(AgGridComponent, { static: true })
  public grid: AgGridComponent

  @Input()
  public quickFilter: string

  @Input()
  public stateKey: string

  public get gridData() {
    return this.displayItems
  }

  public gridOptions: GridOptions = this.adapter.buildGridOptions({
    rowHeight: 40,
    suppressMenuHide: true,
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
    },
    onSelectionChanged: (it) => {
      const ids = it.api.getSelectedRows().map((it) => this.adapter.entityID(it))
      this.zone.run(() => this.selectionChange.next(ids))
    },
    onRowDataChanged: () => {
      if (this.selection) {
        this.select(this.selection, {
          ensureVisible: true,
        })
      }
    },
    onFirstDataRendered: () => {
      // this.loadFilterState()
    },
    onFilterChanged: () => {
      // this.saveFilterState()
    }
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Output()
  public categories = defer(() => this.items)
    .pipe(map((items) => {
      return Array.from(new Set(items.map((it) => this.adapter.entityCategory(it)).filter((it) => !!it)))
    }))

  private items = defer(() => this.adapter.entities)
  private displayItems = defer(() => combineLatest({
    items: this.items,
    category: this.adapter.category
  }))
  .pipe(map(({ items, category }) => {
    if (!category) {
      return items
    }
    return  items.filter((it) => this.adapter.entityCategory(it) === category)
  }))

  private gridStorage: StorageNode<{ columns?: any, filter?: any }>

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
    this.locale.value$
      .pipe(filter(() => !!this.grid?.api))
      .pipe(takeUntil(this.destroy.$))
      .subscribe(() => {
        this.grid.api.refreshCells({ force: true })
      })
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.cdRef.markForCheck()

    // if (this.getChange(changes, 'selection')) {
    //   this.select(this.selection)
    // }

  }

  public ngOnDestroy() {
    this.saveColumnState()
  }

  public onGridReady() {
    this.loadColumnState()
  }

  public setCategory(category: string) {
    this.adapter.category.next(category)
  }

  private getChange(ch: SimpleChanges, key: keyof this) {
    return ch[key as any]
  }

  private select(toSelect: string[], options?: { ensureVisible: boolean }) {
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
      ...this.gridStorage.get(key) || {},
      columns: api.getColumnState()
    })
  }

  private saveFilterState() {
    const key = this.stateKey
    const api = this.grid.api
    if (!key || !api) {
      return
    }
    this.gridStorage.set(key, {
      ...this.gridStorage.get(key) || {},
      filter: api.getFilterModel()
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
