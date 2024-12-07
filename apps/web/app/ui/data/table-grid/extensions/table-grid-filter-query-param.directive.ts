import { Directive, input } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { isEqual } from 'lodash'
import { NEVER, combineLatest, merge, of, switchMap, tap } from 'rxjs'
import { AgGrid } from '~/ui/data/ag-grid'
import { debounceSync } from '~/utils'
import { TableGridPersistenceService } from '../table-grid-persistence.service'
import { TableGridStore } from '../table-grid.store'

@Directive({
  standalone: true,
  selector: 'nwb-table-grid[filterQueryParam]',
})
export class DataGridFilterQueryParamDirective {
  public filterQueryParam = input<string>(null)

  public constructor(
    private router: Router,
    private store: TableGridStore,
    private persistence: TableGridPersistenceService,
  ) {
    combineLatest({
      grid: toObservable(this.store.grid),
      filterParam: toObservable(this.filterQueryParam),
    })
      .pipe(
        debounceSync(),
        switchMap(({ grid, filterParam }) => {
          if (!grid || !filterParam) {
            return NEVER
          }
          const filterModel = this.resolveFilterModel(grid, filterParam)
          return combineLatest({
            filterParam: of(filterParam),
            filterModel: merge(of(filterModel), this.persistence.onFilterSaved),
          })
        }),
        tap(({ filterModel, filterParam }) => {
          // TODO: enable filter param
          // setQueryParam(this.router, filterParam, filterModel)
        }),
      )
      .pipe(takeUntilDestroyed())
      .subscribe()
  }

  private resolveFilterModel(grid: AgGrid, filterParam: string) {
    const filter = getQueryParam(this.router, filterParam) || grid.api.getFilterModel()
    if (!filter) {
      return null
    }
    setTimeout(() => {
      this.store.patchState({ filterModel: filter })
    })
    return filter
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
