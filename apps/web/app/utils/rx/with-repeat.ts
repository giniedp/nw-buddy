import { Observable, map, startWith, switchMap } from 'rxjs'

export function withRepeat<T>(repeater$: Observable<unknown>) {
  return switchMap((value: T) => {
    return repeater$.pipe(
      map(() => value),
      startWith(value),
    )
  })
}
