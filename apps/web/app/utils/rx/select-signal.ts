import { Signal, isSignal, untracked } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import {
  Observable,
  ObservableInput,
  ObservableInputTuple,
  OperatorFunction,
  combineLatest,
  distinctUntilChanged,
  from,
  isObservable,
  map,
  of,
  take,
} from 'rxjs'

export type ObservableSignalInput<T> = ObservableInput<T> | Signal<T>

/**
 * So that we can have `fn([Observable<A>, Signal<B>]): Observable<[A, B]>`
 */
type ObservableSignalInputTuple<T> = {
  [K in keyof T]: ObservableSignalInput<T[K]>
}

export function selectSignal<Input extends readonly unknown[], Output = Input>(
  sources: readonly [...ObservableSignalInputTuple<Input>],
  project?: (input: Input) => Output,
): Signal<Output>

export function selectSignal<Input extends object, Output = Input>(
  sources: ObservableSignalInputTuple<Input>,
  project?: (input: Input) => Output,
): Signal<Output>

export function selectSignal<T, Output = T>(
  sources: Observable<T> | Signal<T>,
  project?: (input: T) => Output,
): Signal<Output>

export function selectSignal(sources: any, project?: (input: any) => any): Signal<any> {
  if (isSignal(sources) || isObservable(sources)) {
    sources = [sources]
    const proj = project
    project = (it) => proj ? proj(it[0]) : it[0]
  }

  const normalizedSources: Array<any> | Record<string, any>  = Array.isArray(sources) ? [] : {}
  const initialValues: Array<any> | Record<string, any> = Array.isArray(sources) ? [] : {}

  for (const key in sources) {
    const source = sources[key]
    if (isSignal(source)) {
      normalizedSources[key] = toObservable(source)
      initialValues[key] = untracked(source)
    } else if (isObservable(source)) {
      normalizedSources[key] = source.pipe(distinctUntilChanged())
      initialValues[key] = null
    } else {
      normalizedSources[key] = from(source as any).pipe(distinctUntilChanged())
      initialValues[key] = null
    }
  }

  let source$ = combineLatest(normalizedSources as any)
  let values = initialValues
  if (project) {
    source$ = source$.pipe(map(project))
    values = project(values)
  }

  return toSignal(source$, { initialValue: values })
}
