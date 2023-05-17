import { Directive, Input } from '@angular/core'
import { BehaviorSubject, combineLatest, defer, map, ReplaySubject, switchMap } from 'rxjs'
import { shareReplayRefCount, tapDebug } from '~/utils'
import { Pagination } from './pagination'

@Directive({
  standalone: true,
  selector: '[nwbInfniteScroll]',
  exportAs: 'infiniteScroll',
})
export class InfiniteScrollDirective<T> {
  @Input()
  public set nwbInfniteScrollPerPage(value: number) {
    this.perPage$.next(value)
  }

  @Input()
  public set nwbInfniteScroll(value: T[]) {
    this.items$.next(value || [])
  }

  public readonly pagination$ = defer(() =>
    combineLatest({
      perPage: this.perPage$,
      items: this.items$,
    })
  )
    .pipe(
      map(({ perPage, items }) => {
        return Pagination.fromArray(items, {
          perPage: perPage,
          update: (state, page) => {
            const data = [...state.data, ...page.data]
            return {
              data: data,
              page: page.page,
              perPage: perPage,
              total: page.total,
              canLoad: data.length < items.length,
            }
          },
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public readonly state$ = this.pagination$.pipe(switchMap((state) => state.state)).pipe(shareReplayRefCount(1))
  public readonly data$ = this.state$.pipe(map((state) => state.data))
  public readonly canLoad$ = this.state$.pipe(map((state) => state.canLoad))
  public readonly count$ = this.state$.pipe(map((state) => state.data?.length || 0))

  private perPage$ = new BehaviorSubject<number>(50)
  private items$ = new ReplaySubject<T[]>(1)
}
