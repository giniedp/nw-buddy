import {
  Observable,
  ObservableInput,
  ObservedValueOf,
  combineLatest,
  distinctUntilChanged,
  isObservable,
  map,
  shareReplay,
} from 'rxjs'
import { debounceSync } from './debounce-sync'
import { ValueEqualityFn } from '@angular/core'

export interface SelectConfig<T = unknown> {
  debounce?: boolean
  equal?: ValueEqualityFn<T>
}

export function selectStream<T extends Record<string, ObservableInput<any>>>(source: T): Observable<T>
export function selectStream<T>(source: Observable<T>): Observable<T>
export function selectStream<T extends Record<string, ObservableInput<any>>, R>(
  source: T,
  project?: (input: { [K in keyof T]: ObservedValueOf<T[K]> }) => R,
  config?: SelectConfig<R>,
): Observable<R>
export function selectStream<T, R>(
  stream$: Observable<T>,
  project?: (input: T) => R,
  config?: SelectConfig<R>,
): Observable<R>
export function selectStream(
  stream$: Observable<any>,
  project?: (input: any) => any,
  config?: SelectConfig<any>,
): Observable<any> {
  if (!isObservable(stream$)) {
    stream$ = combineLatest(stream$ as any)
  }

  return stream$
    .pipe(config?.debounce ? debounceSync() : (it) => it)
    .pipe(map(project || ((it) => it)))
    .pipe(distinctUntilChanged(config?.equal))
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      }),
    )
}
