import { Signal, ValueEqualityFn, isSignal, untracked } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { groupBy, isEqual } from 'lodash'
import {
  Observable,
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
  combineLatest,
  distinctUntilChanged,
  from,
  isObservable,
  map,
  of,
  pipe,
  shareReplay,
  switchMap,
  take,
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
    distinctUntilChanged((a, b) => isEqual(a, b)),
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

export type ObservableSignalInput<T> = ObservableInput<T> | Signal<T>

/**
 * So that we can have `fn([Observable<A>, Signal<B>]): Observable<[A, B]>`
 */
type ObservableSignalInputTuple<T> = {
  [K in keyof T]: ObservableSignalInput<T[K]>
}

export function selectSignal<Input extends readonly unknown[], Output = Input>(
  sources: readonly [...ObservableSignalInputTuple<Input>],
  operator?: OperatorFunction<Input, Output>,
): Signal<Output>

export function selectSignal<Input extends object, Output = Input>(
  sources: ObservableSignalInputTuple<Input>,
  operator?: OperatorFunction<Input, Output>,
): Signal<Output>

export function selectSignal(sources: any, operator?: OperatorFunction<any, any>): Signal<any> {
  let { normalizedSources, initialValues } = Object.entries(sources).reduce(
    (acc, [keyOrIndex, source]) => {
      if (isSignal(source)) {
        acc.normalizedSources[keyOrIndex] = toObservable(source)
        acc.initialValues[keyOrIndex] = untracked(source)
      } else if (isObservable(source)) {
        acc.normalizedSources[keyOrIndex] = source.pipe(distinctUntilChanged())
        source.pipe(take(1)).subscribe((attemptedSyncValue) => {
          if (acc.initialValues[keyOrIndex] !== null) {
            acc.initialValues[keyOrIndex] = attemptedSyncValue
          }
        })
        acc.initialValues[keyOrIndex] ??= null
      } else {
        acc.normalizedSources[keyOrIndex] = from(source as any).pipe(distinctUntilChanged())
        acc.initialValues[keyOrIndex] = null
      }

      return acc
    },
    {
      normalizedSources: Array.isArray(sources) ? [] : {},
      initialValues: Array.isArray(sources) ? [] : {},
    } as {
      normalizedSources: any
      initialValues: any
    },
  )

  normalizedSources = combineLatest(normalizedSources)
  if (operator) {
    normalizedSources = normalizedSources.pipe(operator)
    operator(of(initialValues))
      .pipe(take(1))
      .subscribe((newInitialValues) => {
        initialValues = newInitialValues
      })
  }

  return toSignal(normalizedSources, { initialValue: initialValues })
}
