import { Observable, ObservableInput, combineLatest, of } from 'rxjs'

export function combineLatestOrEmpty<T>(list: Array<ObservableInput<T>>): Observable<Array<T>> {
  if (!list?.length) {
    return of([])
  }
  return combineLatest(list)
}
