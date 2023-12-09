import { AgGridEvent, Grid, GridOptions, GridReadyEvent } from '@ag-grid-community/core'
import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewContainerRef,
  inject,
} from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Observable, ReplaySubject, Subject, defer, filter, merge, skipWhile, take, takeUntil, tap } from 'rxjs'
import { runOutsideZone } from '~/utils/rx/run-in-zone'
import { AngularFrameworkComponentWrapper } from './component-wrapper/angular-framework-component-wrapper'
import { AngularFrameworkOverrides } from './component-wrapper/angular-framework-overrides'
import { fromGridEvent } from './from-grid-event'
import { AgGrid, AgGridEvents } from './types'

@Directive({
  standalone: true,
  selector: '[nwbGrid]',
  host: {
    '[class.ag-grid]': 'true',
    '[class.ag-theme-alpine-dark]': 'true',
  },
  providers: [AngularFrameworkOverrides, AngularFrameworkComponentWrapper],
})
export class AgGridDirective<T = any>
  extends ComponentStore<{ data: T[]; options: GridOptions<T> }>
  implements OnInit, OnDestroy
{
  @Input()
  public set gridData(value: T[]) {
    this.patchState({ data: value })
  }

  @Input()
  public set gridOptions(value: GridOptions<T>) {
    this.patchState({ options: value })
  }

  @Output()
  public onReady = new ReplaySubject<AgGrid>(1)

  protected readonly data$ = this.select((it) => it.data)
  protected readonly options$ = this.select((it) => it.options)
  private dispose$ = new Subject<void>()

  private angularFrameworkOverrides = inject(AngularFrameworkOverrides)
  private frameworkComponentWrapper = inject(AngularFrameworkComponentWrapper)
  private viewRef = inject(ViewContainerRef)

  public constructor(
    private elRef: ElementRef<HTMLElement>,
    private zone: NgZone,
  ) {
    super({ data: null, options: null })
  }

  public ngOnInit(): void {
    this.frameworkComponentWrapper.setViewContainerRef(this.viewRef)

    this.options$
      .pipe(
        runOutsideZone(this.zone),
        tap({
          finalize: () => this.disposeGrid(),
          next: (options) => {
            this.disposeGrid()
            if (options) {
              this.createGrid(options)
            }
          },
        }),
        takeUntil(this.destroy$),
      )
      .subscribe()
  }

  private disposeGrid() {
    this.dispose$.next()
  }

  private createGrid(options: GridOptions) {
    const grid = new Grid(
      this.elRef.nativeElement,
      {
        ...(options || {}),
        context: {
          destroy$: defer(() => this.dispose$),
        },
        onGridReady: (e) => this.onGridReady(e, options),
      },
      {
        frameworkOverrides: this.angularFrameworkOverrides as any,
        providedBeanInstances: {
          frameworkComponentWrapper: this.frameworkComponentWrapper,
        },
      },
    )
    this.dispose$.pipe(take(1)).subscribe(() => {
      grid.destroy()
    })
  }

  private onGridReady(e: GridReadyEvent, options: GridOptions) {
    this.zone.run(() => {
      this.onReady.next(e)
      options?.onGridReady?.(e)
    })
    this.data$
      .pipe(skipWhile((it) => it == null))
      .pipe(filter((it) => it != null))
      .pipe(takeUntil(merge(this.destroy$, this.dispose$)))
      .subscribe((data) => e.api.setRowData(data))
  }

  public onEvent(event: AgGridEvents): Observable<AgGridEvent<T>> {
    return fromGridEvent(this.onReady, event)
  }
}
