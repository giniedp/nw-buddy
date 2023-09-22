import { AgGridEvent, GridApi, GridOptions, RowDataTransaction } from '@ag-grid-community/core'
import { EMPTY, NEVER, Observable, from, isObservable, merge, of, switchMap } from 'rxjs'
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

export function whenGridReady<T>(options: GridOptions<T>) {
  return new Promise<AgGridEvent>((resolve) => {
    const onReady = options.onGridReady
    options.onGridReady = (e) => {
      onReady?.(e)
      resolve(e)
    }
  })
}

export function augmentWithTransactions<T>(
  options: GridOptions<T>,
  events: {
    onCreate: Observable<T>
    onUpdate: Observable<T>
    onDestroy: Observable<string>
  }
) {
  if (!events) {
    return EMPTY
  }
  return from(whenGridReady(options)).pipe(
    switchMap(({ api }) => {
      return merge(
        events.onCreate.pipe(switchMap((item) => txInsert([item]))),
        events.onUpdate.pipe(switchMap((item) => txUpdate([item]))),
        events.onDestroy.pipe(switchMap((recordId) => txRemove([recordId], api, options.getRowId)))
      )
    })
  )
}

async function txInsert<T>(items: T[]): Promise<RowDataTransaction> {
  return {
    add: items,
  }
}

async function txUpdate<T>(items: T[]): Promise<RowDataTransaction> {
  return {
    update: items,
  }
}

async function txRemove<T>(ids: string[], api: GridApi, getRowId: (it: T) => string): Promise<RowDataTransaction> {
  const nodes = []
  api.forEachNode((node) => {
    if (ids.includes(getRowId(node.data) as string)) {
      nodes.push(node.data)
    }
  })
  return {
    remove: nodes,
  }
}
