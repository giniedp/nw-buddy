import { Observable, combineLatest, of } from 'rxjs'

export function combineLatestOrEmpty<T>(list: Array<Observable<T>>): Observable<Array<T>> {
  if (!list?.length) {
    return of([])
  }
  return combineLatest(list)
}
