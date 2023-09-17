import { AgGridEvent, GridApi } from '@ag-grid-community/core'
import { NEVER, Observable, isObservable, of, switchMap } from 'rxjs'
import { AgGrid, AgGridEvents } from './types'

export function fromGridEvent<T extends AgGridEvent = AgGridEvent>(
  grid$: AgGrid | Observable<AgGrid>,
  event: AgGridEvents
) {
  const ready$ = isObservable(grid$) ? grid$ : of(grid$)
  return ready$.pipe(
    switchMap((grid) => {
      if (!grid?.api) {
        return NEVER
      }
      const api = grid.api
      return new Observable<T>((sub) => {
        const handler = (res: T) => sub.next(res)
        api.addEventListener(event as string, handler)
        return () => api.removeEventListener(event as string, handler)
      })
    })
  )
}
