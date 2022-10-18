import { catchError, defer, map, Observable, of, startWith } from 'rxjs'

export type RxState<T> = {
  value?: T
  loading: boolean
  error?: Error
}

export type RxStateFlat<T extends Record<string, any>> = Partial<T> & {
  loading: boolean
  error?: Error
}

export function deferState<T>(fn: () => Observable<T>) {
  return defer(() => rxState(fn()))
}

export function rxState<T>(source: Observable<T>): Observable<RxState<T>> {
  return source
    .pipe(map<T, RxState<T>>((value) => ({ value: value, loading: false })))
    .pipe(startWith<RxState<T>>({ value: null as T, loading: true }))
    .pipe(catchError((error: Error) => {
      console.error(error)
      return of<RxState<T>>({ value: null as T, loading: false, error: error })
    }))
}

export function deferStateFlat<T extends Record<string, any>>(fn: () => Observable<T>) {
  return defer(() => rxStateFlat(fn()))
}

export function rxStateFlat<T extends Record<string, any>>(source: Observable<T>): Observable<RxStateFlat<T>> {
  return source
    .pipe(map((value: T) => {
      return {
        ...(value || {}),
        loading: false,
        error: null
      } as RxStateFlat<T>
    }))
    .pipe(startWith({ loading: true } as RxStateFlat<T>))
    .pipe(catchError((error: Error) => {
      console.error(error)
      return of({ loading: false, error: error } as RxStateFlat<T>)
    }))
}
