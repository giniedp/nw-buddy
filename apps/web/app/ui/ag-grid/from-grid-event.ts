import { GridApi } from '@ag-grid-community/core'
import { Observable, tap } from 'rxjs'

export function fromGridEvent<T = unknown>(api: GridApi, event: string) {
  return new Observable<T>((sub) => {
    const handler = (res: T) => sub.next(res)
    api.addEventListener(event, handler)
    return () => api.removeEventListener(event, handler)
  })
}
