import { Observable, map, startWith, switchMap } from 'rxjs'

export function withUpdate<T>(source: Observable<unknown>) {
  return switchMap((value: T) => {
    return source.pipe(
      map(() => value),
      startWith(value)
    )
  })
}
