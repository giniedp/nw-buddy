import { Directive, Input, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { isEqual } from 'lodash'
import { Subject, combineLatest, debounce, debounceTime, merge, of, switchMap, takeUntil } from 'rxjs'
import { DataTableComponent } from './data-table.component'
@Directive({
  standalone: true,
  selector: 'nwb-data-table[filterQueryParam]',
})
export class FilterRouteParamDirective implements OnDestroy {
  @Input()
  public filterQueryParam: string

  private destroy$ = new Subject<void>()

  public constructor(private router: Router, private table: DataTableComponent<unknown>) {
    //
  }

  public ngOnInit(): void {
    this.table.adapter.grid
      .pipe(
        debounceTime(0), // HINT: needed or getFilterModel() may return empty data sometimes, FIXME: find out why
        switchMap((grid) => {
          const filter = getQueryParam(this.router, this.filterQueryParam) || grid.api.getFilterModel()
          if (filter) {
            setTimeout(() => {
              this.table.filter = filter
            })
          }

          return combineLatest({
            data: this.table.gridData,
            filter: merge(of(filter), this.table.filterSaved)
          })
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ filter }) => {
        setQueryParam(this.router, this.filterQueryParam, filter)
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

function getQueryParam(router: Router, param: string) {
  const value = router.parseUrl(router.url).queryParamMap.get(param)
  return decodeFilterData(value)
}

function setQueryParam(router: Router, param: string, data: any) {
  if (!param) {
    return
  }
  const value = encodeFilterData(data)
  const params = router.parseUrl(router.url).queryParams || {}
  if (!value) {
    delete params[param]
  } else {
    params[param] = value
  }
  router.navigate([], {
    queryParams: params,
  })
}

function encodeFilterData(data: any): string {
  if (isEqual(data, []) || isEqual(data, {})) {
    return null
  }
  try {
    return btoa(JSON.stringify(data))
  } catch {
    return null
  }
}

function decodeFilterData(data: string): any {
  if (!data) {
    return null
  }
  try {
    return JSON.parse(atob(data))
  } catch {
    return null
  }
}
