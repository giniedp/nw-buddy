import { Directive } from '@angular/core'
import { Router } from '@angular/router'
import { isEqual } from 'lodash'
import { NEVER, combineLatest, merge, of, switchMap, takeUntil, tap } from 'rxjs'
import { debounceSync } from '~/utils'
import { AgGrid } from '../ag-grid'
import { DataGridPersistenceService } from './data-grid-persistence.service'
import { DataGridStore } from './data-grid.store'

@Directive({
  standalone: true,
})
export class DataGridFilterModelDirective {
  public constructor(
    private router: Router,
    private store: DataGridStore,
    private persistence: DataGridPersistenceService
  ) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      grid: this.store.grid$,
      filterParam: this.store.filterParam$,
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
          setQueryParam(this.router, filterParam, filterModel)
        })
      )
      .pipe(takeUntil(this.store.destroy$))
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
