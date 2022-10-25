import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core'
import { ColumnApi, Grid, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { merge } from 'lodash'
import { debounceTime, distinctUntilChanged, ReplaySubject, Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'nwb-ag-grid',
  template: '',
  styleUrls: ['./ag-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ag-grid select-text'
  },
})
export class AgGridComponent<T = any> implements OnInit, OnDestroy {
  @Input()
  public set data(value: T[]) {
    this.data$.next(value)
  }

  @Input()
  public set options(value: GridOptions) {
    this.options$.next(value)
  }

  @Input()
  public set quickFilter(value: string) {
    this.filter$.next(value)
  }

  @Output()
  public gridReady = new EventEmitter<GridReadyEvent>()

  @Output()
  public beforeDestroy = new EventEmitter<void>()

  public grid: Grid

  private data$ = new ReplaySubject<T[]>(1)
  private options$ = new ReplaySubject<GridOptions>(1)
  private destroy$ = new Subject<void>()
  private filter$ = new Subject<string>()

  public constructor(private elRef: ElementRef<HTMLElement>, private zone: NgZone) {
    //
  }

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.options$.pipe(takeUntil(this.destroy$)).subscribe((options) => {
        this.disposeGrid()
        this.createGrid(options)
      })
    })
  }

  public ngOnDestroy(): void {
    this.beforeDestroy.next()
    this.destroy$.next(null)
    this.destroy$.complete()
    this.disposeGrid()
  }

  private onGridReady(e: GridReadyEvent, options: GridOptions) {
    this.zone.run(() => {
      this.gridReady.emit(e)
      options?.onGridReady?.(e)
    })
    const cancel$ = merge(this.destroy$, this.options$)
    this.data$.pipe(takeUntil(cancel$)).subscribe((data) => e.api.setRowData(data))
    this.filter$
      .pipe(debounceTime(500))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(cancel$))
      .subscribe((value) => {
        e.api.setQuickFilter(value)
      })
  }

  private createGrid(options: GridOptions) {
    this.grid = new Grid(this.elRef.nativeElement, {
      ...(options || {}),
      onGridReady: (e) => this.onGridReady(e, options),
    })
  }

  private disposeGrid() {
    const grid = this.grid
    this.grid = null
    grid?.destroy()
  }

}
