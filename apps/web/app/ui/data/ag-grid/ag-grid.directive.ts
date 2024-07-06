import { AgGridEvent, GridApi, GridOptions, GridParams, GridReadyEvent, createGrid } from '@ag-grid-community/core'
import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewContainerRef,
  inject,
} from '@angular/core'
import {
  Observable,
  ReplaySubject,
  defer,
  filter,
  firstValueFrom,
  map,
  shareReplay,
  skipWhile,
  switchMap,
  take,
  takeUntil,
} from 'rxjs'
import { runOutsideZone } from '~/utils/rx/run-in-zone'
import { AngularFrameworkComponentWrapper } from './component-wrapper/angular-framework-component-wrapper'
import { AngularFrameworkOverrides } from './component-wrapper/angular-framework-overrides'
import { fromGridEvent } from './from-grid-event'
import { AgGridEvents } from './types'
import { injectIsBrowser } from '~/utils/injection/platform'

@Directive({
  standalone: true,
  selector: '[nwbGrid]',
  host: {
    '[class.ag-grid]': 'true',
    '[class.ag-theme-alpine-dark]': 'true',
  },
  providers: [AngularFrameworkOverrides, AngularFrameworkComponentWrapper],
})
export class AgGridDirective<T = any> implements AfterViewInit, OnDestroy {
  @Input()
  public set gridData(value: T[]) {
    this.data$.next(value)
  }

  @Input()
  public set gridOptions(value: GridOptions<T>) {
    this.options$.next(value)
  }

  @Output()
  public onReady = defer(() => this.events.gridReady).pipe(shareReplay(1))

  @Output()
  public onDestroy = new ReplaySubject<void>(1)

  protected readonly data$ = new ReplaySubject<T[]>(1)
  protected readonly options$ = new ReplaySubject<GridOptions<T>>(1)
  private initialized$ = new ReplaySubject<void>(1)

  private angularFrameworkOverrides = inject(AngularFrameworkOverrides)
  private frameworkComponentWrapper = inject(AngularFrameworkComponentWrapper)
  private viewRef = inject(ViewContainerRef)
  private elRef = inject(ElementRef)
  private zone = inject(NgZone)
  private isBrowser = injectIsBrowser()

  public ngOnDestroy(): void {
    this.onDestroy.next()
  }

  public ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return
    }
    this.angularFrameworkOverrides.runOutsideAngular(() => {
      this.frameworkComponentWrapper.setViewContainerRef(this.viewRef, this.angularFrameworkOverrides)
    })

    let grid: GridApi = null
    this.options$
      .pipe(
        runOutsideZone(this.zone),
        map((options) => {
          return {
            animateRows: false,
            ...(options || {}),
            context: this,
          }
        }),
        takeUntil(this.onDestroy),
      )
      .subscribe((options) => {
        if (!grid) {
          grid = this.createGrid(options)
        } else {
          grid.updateGridOptions(options)
        }
      })

    this.onReady
      .pipe(
        take(1),
        switchMap(() => this.data$),
        skipWhile((it) => it == null),
        filter((it) => it != null),
        takeUntil(this.onDestroy),
      )
      .subscribe((data) => {
        if (grid) {
          grid.setGridOption('rowData', data)
        }
      })

    this.onDestroy.pipe(take(1)).subscribe(() => {
      if (grid) {
        grid.destroy()
        grid = null
      }
    })
    this.initialized$.next()
  }

  private createGrid(options: GridOptions) {
    const params: GridParams = {
      globalEventListener: this.eventEmitter.bind(this),
      frameworkOverrides: this.angularFrameworkOverrides,
      providedBeanInstances: {
        frameworkComponentWrapper: this.frameworkComponentWrapper,
      },
    }
    return createGrid(this.elRef.nativeElement, options, params)
  }

  public onEvent(event: AgGridEvents): Observable<AgGridEvent<T>> {
    return fromGridEvent(this.onReady, event)
  }

  private eventEmitter = (eventType: string, event: any) => {
    const emitter = <EventEmitter<any>>this.events[eventType]
    if (!emitter) {
      return
    }
    this.angularFrameworkOverrides.runInsideAngular(() => {
      if (eventType === 'gridReady') {
        firstValueFrom(this.initialized$).then(() => emitter.emit(event))
      } else {
        emitter.emit(event)
      }
    })
  }

  private events = {
    gridReady: new EventEmitter<GridReadyEvent<T>>(),
  }
}
