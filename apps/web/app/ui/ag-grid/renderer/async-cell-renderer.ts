import { AgPromise, ICellRendererComp, ICellRendererParams } from 'ag-grid-community'
import { catchError, NEVER, Observable, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'

export interface AsyncCellRendererParams<T, R> {
  source: (params: ICellRendererParams<T, any>) => Observable<R>
  create?: () => HTMLElement
  update?: (el: HTMLElement, value: R) => void
}

export class AsyncCellRenderer<T> implements ICellRendererComp<T> {
  public static params<T, R>(params: AsyncCellRendererParams<T, R>) {
    return params
  }

  protected destroy$ = new Subject<void>()
  protected el: HTMLElement
  protected params = new ReplaySubject<ICellRendererParams<T, any> & AsyncCellRendererParams<unknown, T>>(1)

  public getGui(): HTMLElement {
    return this.el
  }
  public destroy(): void {
    this.destroy$.next()
  }
  public init(params: ICellRendererParams<T, any> & AsyncCellRendererParams<unknown, T>): void | AgPromise<void> {
    this.params.next(params)
    this.el = params.create ? params.create() : document.createElement('span')
    this.params
      .pipe(switchMap((params) => params.source(params)))
      .pipe(takeUntil(this.destroy$))
      .pipe(
        catchError((err) => {
          console.error(err)
          return NEVER
        })
      )
      .subscribe((value) => {
        if (params.update) {
          params.update(this.el, value)
        } else {
          this.el.textContent = String(value)
        }
      })
  }
  public refresh(params: ICellRendererParams<T, any> & AsyncCellRendererParams<unknown, T>): boolean {
    this.params.next(params)
    return true
  }
}
