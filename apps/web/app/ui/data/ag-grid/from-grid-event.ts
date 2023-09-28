import { AgGridEvent, GetRowIdFunc, GridApi, GridOptions, RowDataTransaction } from '@ag-grid-community/core'
import {
  EMPTY,
  NEVER,
  Observable,
  catchError,
  filter,
  isObservable,
  map,
  merge,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
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
        return () => {
          try {
            api.removeEventListener(event as string, handler)
          } catch (err) {
            // TODO: use destroy event to unsubscribe before grid is destroyed
            console.error(err)
          }
        }
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

export async function augmentWithTransactions<T>(
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
  const { api, context } = await whenGridReady(options)
  const getRowId = options.getRowId
  if (!getRowId) {
    throw new Error('getRowId is not set')
  }

  // TODO: switch to using grid events, when feature AG-684 ships
  const destroy$ = context?.destroy$ as Observable<void>
  if (!isObservable(destroy$)) {
    console.log(context)
    throw new Error('destroy$ not found in context is not set')
  }

  return merge(
    events.onCreate.pipe(map((item) => txInsert([item]))).pipe(catchError(() => of(null))),
    events.onUpdate.pipe(map((item) => txUpdate([item]))).pipe(catchError(() => of(null))),
    events.onDestroy.pipe(map((recordId) => txRemove([recordId], api, getRowId))).pipe(catchError((err) => of(null)))
  )
    .pipe(filter((it) => !!it))
    .pipe(tap((tx) => api.applyTransactionAsync(tx)))
    .pipe(takeUntil(destroy$))
    .subscribe()
}

function txInsert<T>(items: T[]): RowDataTransaction {
  return {
    add: items,
  }
}

function txUpdate<T>(items: T[]): RowDataTransaction {
  return {
    update: items,
  }
}

function txRemove<T>(ids: string[], api: GridApi, getRowId: GetRowIdFunc): RowDataTransaction {
  const nodes = []
  api.forEachNode((node) => {
    if (
      ids.includes(
        getRowId({
          data: node.data,
        } as any) as string
      )
    ) {
      nodes.push(node.data)
    }
  })
  return {
    remove: nodes,
  }
}
