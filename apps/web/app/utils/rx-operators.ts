import { ValueEqualityFn } from '@angular/core'
import { groupBy, isEqual } from 'lodash'
import {
  combineLatest,
  distinctUntilChanged,
  isObservable,
  map,
  Observable,
  ObservableInput,
  ObservedValueOf,
  of,
  pipe,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs'
import { debounceSync } from './debounce-sync'
export * from './debounce-sync'

export function mapProp<T, K extends keyof T>(prop: K) {
  return map<T, T[K]>((it) => it?.[prop])
}

export function mapPropTruthy<T, K extends keyof T>(prop: K) {
  return map<T, boolean>((it) => !!it?.[prop])
}

export function mapPropFalsey<T, K extends keyof T>(prop: K) {
  return map<T, boolean>((it) => !it?.[prop])
}

export function mapPropEq<T, K extends keyof T>(prop: K, equals: any) {
  return map<T, boolean>((it) => it?.[prop] === equals)
}

export function mapFilter<T>(predicate: (value: T, index: number, array: T[]) => boolean) {
  return map<T[], T[]>((list) => list?.filter(predicate))
}

export function mapFind<T>(predicate: (value: T, index: number, array: T[]) => boolean) {
  return map<T[], T>((list) => list?.find(predicate))
}

export function mapList<T, R>(predicate: (value: T, index: number, array: T[]) => R) {
  return map<T[], R[]>((list) => list?.map(predicate))
}

export function mapGroupBy<T>(predicate: (value: T) => string) {
  return map<T[], Record<string, T[]>>((list) => groupBy(list || [], predicate))
}

export function mapRecordEntries<T, R>(mapper: (value: [string, T]) => R) {
  return map<Record<string, T>, R[]>((it) => Object.entries(it || {}).map(mapper))
}

export function mapDistinct<T, R>(mapper: (value: T) => R) {
  return pipe(
    map<T, R>(mapper),
    distinctUntilChanged((a, b) => isEqual(a, b))
  )
}

export function switchMapCombineLatest<T, R>(project: (list: T) => Observable<R>) {
  return switchMap((list: T[]): Observable<R[]> => {
    if (!list?.length) {
      return of<R[]>([])
    }
    return combineLatest(list.map(project))
  })
}

export function tapDebug<T>(tag: string, options?: { disabled?: boolean; transform?: (value: T) => any }) {
  return tap<T>({
    next(value) {
      if (!options?.disabled) {
        const data = options?.transform ? options.transform(value) : value
        console.log(`%c[${tag}: Next]`, 'background: #009688; color: #fff; padding: 2px; font-size: 10px;', data)
      }
    },
    error(error) {
      if (!options?.disabled) {
        console.log(`%[${tag}: Error]`, 'background: #E91E63; color: #fff; padding: 2px; font-size: 10px;', error)
      }
    },
    complete() {
      if (!options?.disabled) {
        console.log(`%c[${tag}]: Complete`, 'background: #00BCD4; color: #fff; padding: 2px; font-size: 10px;')
      }
    },
  })
}

export interface SelectConfig<T = unknown> {
  debounce?: boolean
  equal?: ValueEqualityFn<T>
}

export function selectStream<T extends Record<string, ObservableInput<any>>>(source: T): Observable<T>
export function selectStream<T>(source: Observable<T>): Observable<T>
export function selectStream<T extends Record<string, ObservableInput<any>>, R>(
  source: T,
  project?: (input: { [K in keyof T]: ObservedValueOf<T[K]> }) => R,
  config?: SelectConfig<R>
): Observable<R>
export function selectStream<T, R>(
  stream$: Observable<T>,
  project?: (input: T) => R,
  config?: SelectConfig<R>
): Observable<R>
export function selectStream(
  stream$: Observable<any>,
  project?: (input: any) => any,
  config?: SelectConfig<any>
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
      })
    )
}
