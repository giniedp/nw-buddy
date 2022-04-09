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
} from '@angular/core'
import { ColumnApi, Grid, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { ReplaySubject, Subject, takeUntil } from 'rxjs'

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

  private data$ = new ReplaySubject<T[]>(1)
  private destroy$ = new Subject()
  private grid: Grid
  private api: GridApi
  private colApi: ColumnApi

  public constructor(private elRef: ElementRef<HTMLElement>, private zone: NgZone) {}

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.grid = new Grid(this.elRef.nativeElement, {
        rowHeight: 24,
        ...(this.options || {}),
        onGridReady: (e) => this.onGridReady(e),
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
      this.options?.onGridReady?.(e)
    })
    this.data$.pipe(takeUntil(this.destroy$)).subscribe((data) => this.api.setRowData(data))
  }
}
