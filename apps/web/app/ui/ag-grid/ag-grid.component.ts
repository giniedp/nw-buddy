import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  OnDestroy,
  ElementRef,
  NgZone,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core'
import { ColumnApi, FilterChangedEvent, Grid, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { debounceTime, distinctUntilChanged, ReplaySubject, Subject, takeUntil } from 'rxjs'

import { PreferencesService, StorageScopeNode, StorageNode } from '~/core/preferences'

@Component({
  selector: 'nwb-ag-grid',
  template: '',
  styleUrls: ['./ag-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ag-grid]': 'true'
  }
})
export class AgGridComponent<T = any> implements OnInit, OnChanges, OnDestroy {
  @Input()
  public data: Array<T>

  @Input()
  public options: GridOptions

  @Input()
  public set quickFilter(value: string) {
    this.filter$.next(value)
  }

  @Output()
  public gridReady = new EventEmitter<GridReadyEvent>()

  public grid: Grid
  public api: GridApi
  public colApi: ColumnApi

  private data$ = new ReplaySubject<T[]>(1)
  private destroy$ = new Subject()
  private filter$ = new Subject<string>()

  public constructor(private elRef: ElementRef<HTMLElement>, private zone: NgZone) {

  }

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.grid = new Grid(this.elRef.nativeElement, {
        rowHeight: 24,
        ...(this.options || {}),
        onGridReady: (e) => this.onGridReady(e),
      })

      this.filter$.pipe(debounceTime(500)).pipe(distinctUntilChanged()).subscribe((value) => {
        this.api?.setQuickFilter(value)
      })
    })
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('data' in changes) {
      this.data$.next(this.data)
    }
  }

  public ngOnDestroy(): void {

    this.destroy$.next(null)
    this.destroy$.complete()
    this.grid.destroy()
  }

  private onGridReady(e: GridReadyEvent) {
    this.api = e.api
    this.colApi = e.columnApi
    this.zone.run(() => {
      this.gridReady.emit(e)
      this.options?.onGridReady?.(e)
    })
    this.data$.pipe(takeUntil(this.destroy$)).subscribe((data) => this.api.setRowData(data))
  }
}
