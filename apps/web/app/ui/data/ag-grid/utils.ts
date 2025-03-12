import { Observable, asyncScheduler, debounceTime, map, merge, of, subscribeOn } from 'rxjs'
import { fromGridEvent } from './from-grid-event'
import { AgGrid } from './types'
import { GridApi } from '@ag-grid-community/core'

export function gridHasAnyFilterPresent(grid$: Observable<AgGrid>) {
  return merge(grid$, fromGridEvent(grid$, 'filterChanged')).pipe(
    map((grid) => {
      if (!grid?.api) {
        return of(false)
      }
      return grid.api.isAnyFilterPresent()
    }),
  )
}

export function gridHasQuickFilterPresent(grid$: Observable<AgGrid>) {
  return merge(grid$, fromGridEvent(grid$, 'filterChanged')).pipe(
    map((grid) => {
      if (!grid?.api) {
        return of(false)
      }
      return grid.api.isQuickFilterPresent()
    }),
  )
}

export function gridDisplayRowCount(grid$: Observable<AgGrid>) {
  return merge(
    grid$,
    fromGridEvent(grid$, 'rowDataUpdated'),
    fromGridEvent(grid$, 'firstDataRendered'),
    fromGridEvent(grid$, 'filterChanged'),
  ).pipe(
    subscribeOn(asyncScheduler),
    debounceTime(100),
    map((grid) => {
      if (!grid?.api) {
        return 0
      }
      return grid.api.getDisplayedRowCount()
    }),
  )
}

export function gridGetPinnedTopRows(api: GridApi) {
  return Array.from({ length: api.getPinnedTopRowCount() })
    .map((_, i) => api.getPinnedTopRow(i))
    .filter((it) => !!it)
}

export function gridGetPinnedTopData(api: GridApi) {
  return gridGetPinnedTopRows(api)?.map((it) => it.data)
}

export function gridGetPinnedBottomRows(api: GridApi) {
  return Array.from({ length: api.getPinnedBottomRowCount() })
    .map((_, i) => api.getPinnedBottomRow(i))
    .filter((it) => !!it)
}

export function gridGetPinnedBottomData(api: GridApi) {
  return gridGetPinnedBottomRows(api)?.map((it) => it.data)
}

export function gridClearPinnedRowsTop(api: GridApi) {
  return api.setGridOption('pinnedTopRowData', [])
}

export function gridClearPinnedRowsBottom(api: GridApi) {
  return api.setGridOption('pinnedBottomRowData', [])
}
