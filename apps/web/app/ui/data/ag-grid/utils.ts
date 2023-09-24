import { Observable, asyncScheduler, debounceTime, map, merge, of, subscribeOn } from 'rxjs'
import { fromGridEvent } from './from-grid-event'
import { AgGrid } from './types'

export function gridHasAnyFilterPresent(grid$: Observable<AgGrid>) {
  return merge(grid$, fromGridEvent(grid$, 'filterChanged')).pipe(
    map((grid) => {
      if (!grid?.api) {
        return of(false)
      }
      return grid.api.isAnyFilterPresent()
    })
  )
}

export function gridHasQuickFilterPresent(grid$: Observable<AgGrid>) {
  return merge(grid$, fromGridEvent(grid$, 'filterChanged')).pipe(
    map((grid) => {
      if (!grid?.api) {
        return of(false)
      }
      return grid.api.isQuickFilterPresent()
    })
  )
}

export function gridDisplayRowCount(grid$: Observable<AgGrid>) {
  return merge(
    grid$,
    fromGridEvent(grid$, 'rowDataUpdated'),
    fromGridEvent(grid$, 'rowDataChanged'),
    fromGridEvent(grid$, 'firstDataRendered'),
    fromGridEvent(grid$, 'filterChanged')
  ).pipe(
    subscribeOn(asyncScheduler),
    debounceTime(100),
    map((grid) => {
      if (!grid?.api) {
        return 0
      }
      return grid.api.getDisplayedRowCount()
    })
  )
}
