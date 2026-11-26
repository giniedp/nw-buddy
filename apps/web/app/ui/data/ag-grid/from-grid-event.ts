import { AgGridEvent } from 'ag-grid-community'
import { NEVER, Observable, isObservable, of, switchMap } from 'rxjs'
import { AgGrid, AgGridEvents } from './types'

export function fromGridEvent<T extends AgGridEvent = AgGridEvent>(
  grid$: AgGrid | Observable<AgGrid>,
  event: AgGridEvents,
) {
  const ready$ = isObservable(grid$) ? grid$ : of(grid$)
  return ready$.pipe(
    switchMap((grid) => {
      if (!grid?.api) {
        return NEVER
      }
      const api = grid.api
      return new Observable<T>((sub) => {
        // the listener type depends on the event name, this observable hands out T for any of them
        const handler = (res: unknown) => sub.next(res as T)
        api.addEventListener(event, handler)
        return () => {
          try {
            if (!api.isDestroyed()) {
              api.removeEventListener(event, handler)
            }
          } catch (err) {
            // TODO: use destroy event to unsubscribe before grid is destroyed
            console.error(err)
          }
        }
      })
    }),
  )
}
