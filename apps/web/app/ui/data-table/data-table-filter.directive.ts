import { Directive, Input } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { isEqual } from 'lodash'
import { asyncScheduler, BehaviorSubject, combineLatest, defer, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import { DataTableAdapter } from './data-table-adapter'
import { DataTableComponent } from './data-table.component'

@Directive({
  standalone: true,
  selector: 'nwb-data-table[filterQueryParam]',
})
export class FilterRouteParamDirective {
  @Input()
  public set filterQueryParam(value: string) {
    this.param$.next(value)
  }

  protected filter$ = defer(() => {
    return combineLatest({
      queryParam: this.param$,
      queryMap: this.route.queryParamMap,
    })
  })
    .pipe(map(({ queryMap, queryParam }) => queryMap.get(queryParam)))
    .pipe(
      map((data) => {
        try {
          return JSON.parse(atob(data))
        } catch {
          return null
        }
      })
    )

  private param$ = new BehaviorSubject(null)
  private destroy$ = new Subject()

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adapter: DataTableAdapter<unknown>,
    private table: DataTableComponent<unknown>
  ) {}

  public ngOnInit(): void {
    this.adapter.grid
      .pipe(switchMap(() => this.filter$.pipe(take(1))))
      .pipe(tap((state) => {
        this.table.filter = state
      }))
      .pipe(switchMap(() => this.table.filterSaved))
      .pipe(
        map((data) => {
          if (isEqual(data, []) || isEqual(data, {})) {
            return null
          }
          try {
            return btoa(JSON.stringify(data))
          } catch {
            return null
          }
        })
      )
      .pipe(
        switchMap((data) => {
          return combineLatest({
            filter: of(data),
            query: this.param$,
          })
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ filter, query }) => {
        this.router.navigate(['./'], {
          queryParams: {
            [query]: filter,
          },
          queryParamsHandling: 'merge',
          relativeTo: this.route,
        })
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
