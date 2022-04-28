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
import { BehaviorSubject, combineLatest, defer, filter, map, Subject, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { AgGridComponent } from '~/ui/ag-grid'
import { DataTableAdapter } from './data-table-adapter'

@Component({
  selector: 'nwb-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  })

  @Input()
  public selection: string[]

  @Output()
  public selectionChange = new EventEmitter<string[]>()

  @Input()
  public filter: (item: T) => boolean

  @Input()
  public category: string

  @Output()
  public categories = new EventEmitter<string[]>()

  private items: T[]
  private displayItems: T[]
  private destroy$ = new Subject()
  private category$ = new BehaviorSubject<string>(null)

  public constructor(
    private locale: LocaleService,
    private cdRef: ChangeDetectorRef,
    private adapter: DataTableAdapter<T>,
    private zone: NgZone
  ) {
    //
  }

  public async ngOnInit() {
    this.adapter.entities
      .pipe(
        map((items) => Array.from(new Set(items.map((it) => this.adapter.entityCategory(it)).filter((it) => !!it))))
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((cats) => this.categories.emit(cats))

    combineLatest({
      entities: this.adapter.entities,
      category: this.category$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ entities, category }) => {
        this.items = entities
        this.displayItems = this.items
        if (category) {
          this.displayItems = entities.filter((it) => this.adapter.entityCategory(it) === category)
        }
        this.cdRef.markForCheck()
      })

    this.locale.change
      .pipe(filter(() => !!this.grid?.api))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.grid.api.refreshCells({ force: true })
      })
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.getChange(changes, 'selection')) {
      this.select(this.selection)
    }
    if (this.getChange(changes, 'category')) {
      this.category$.next(this.category)
    }
    if (this.getChange(changes, 'quickFilter')) {
      this.cdRef.markForCheck()
    }
  }

  public ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public setCategory(category: string) {
    this.category$.next(category)
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
}
