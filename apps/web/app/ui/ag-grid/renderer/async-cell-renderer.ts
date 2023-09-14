import { AgPromise, ICellRendererComp, ICellRendererParams } from '@ag-grid-community/core'
import { catchError, NEVER, Observable, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'

export interface AsyncCellRendererParams<T, R> {
  source: (params: ICellRendererParams<T, any, any>) => Observable<R>
  create?: () => HTMLElement
  update?: (el: HTMLElement, value: R) => void
}

type ParamsType<T> = ICellRendererParams<any, any, any> & AsyncCellRendererParams<any, T>

export class AsyncCellRenderer<T> implements ICellRendererComp<T> {
  public static params<T, R>(params: AsyncCellRendererParams<T, R>) {
    return params
  }

  protected destroy$ = new Subject<void>()
  protected el: HTMLElement
  protected params = new ReplaySubject<ParamsType<T>>(1)

  public getGui(): HTMLElement {
    return this.el
  }
  public destroy(): void {
    this.destroy$.next()
  }
  public init(params: ParamsType<T>): void | AgPromise<void> {
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
  public refresh(params: ICellRendererParams<T, any, any> & AsyncCellRendererParams<unknown, T>): boolean {
    this.params.next(params)
    return true
  }
}
