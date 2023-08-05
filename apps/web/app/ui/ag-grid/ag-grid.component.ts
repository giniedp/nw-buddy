import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Grid, GridOptions, GridReadyEvent } from 'ag-grid-community'
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  merge,
  ReplaySubject,
  skipWhile,
  Subject,
  take,
  takeUntil,
  tap,
} from 'rxjs'

export interface AgGridState<T> {
  data: T[]
  options: GridOptions<T>
  filter: string
}

@Component({
  standalone: true,
  selector: 'nwb-ag-grid',
  template: '',
  styleUrls: ['./ag-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ag-grid select-text',
  },
})
export class AgGridComponent<T = any> extends ComponentStore<AgGridState<T>> implements OnInit, OnDestroy {
  @Input()
  public set data(value: T[]) {
    this.patchState({ data: value })
  }

  @Input()
  public set options(value: GridOptions<T>) {
    this.patchState({ options: value })
  }

  @Input()
  public set quickFilter(value: string) {
    this.patchState({ filter: value })
  }

  @Input()
  @HostBinding('style.min-height.px')
  public minHeight: number = null

  @Output()
  public gridReady = new EventEmitter<GridReadyEvent>()

  protected readonly data$ = this.select((it) => it.data)
  protected readonly options$ = this.select((it) => it.options)
  protected readonly filter$ = this.select((it) => it.filter)
  private dispose$ = new Subject<void>()

  public constructor(private elRef: ElementRef<HTMLElement>, private zone: NgZone) {
    super({ data: null, options: null, filter: null })
  }

  public ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.options$
        .pipe(
          tap({
            finalize: () => this.disposeGrid(),
            next: (options) => {
              this.disposeGrid()
              this.createGrid(options)
            },
          })
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe()
    })
  }

  private onGridReady(e: GridReadyEvent, options: GridOptions) {
    this.zone.run(() => {
      this.gridReady.emit(e)
      options?.onGridReady?.(e)
    })
    this.data$
      .pipe(skipWhile((it) => it == null))
      .pipe(filter((it) => it != null))
      .pipe(takeUntil(merge(this.destroy$, this.dispose$)))
      .subscribe((data) => e.api.setRowData(data))
    this.filter$
      .pipe(debounceTime(500))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(merge(this.destroy$, this.dispose$)))
      .subscribe((value) => {
        e.api.setQuickFilter(value)
      })
  }

  private createGrid(options: GridOptions) {
    const grid = new Grid(this.elRef.nativeElement, {
      ...(options || {}),
      onGridReady: (e) => this.onGridReady(e, options),
    })
    this.dispose$.pipe(take(1)).subscribe(() => {
      grid.destroy()
    })
  }

  private disposeGrid() {
    this.dispose$.next()
  }
}
