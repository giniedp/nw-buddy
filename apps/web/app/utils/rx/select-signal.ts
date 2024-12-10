import { Signal, computed, isSignal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Observable, ObservableInput, from, isObservable } from 'rxjs'

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
  if (isObservable(sources)) {
    sources = toSignal(sources)
  }
  if (isSignal(sources)) {
    return computed(() => (project ? project(sources()) : sources()))
  }

  for (const key in sources) {
    const source = sources[key]
    if (!isSignal(source)) {
      if (isObservable(source)) {
        sources[key] = toSignal(source)
      } else {
        sources[key] = toSignal(from(source))
      }
    }
  }

  return computed(() => {
    const result = Array.isArray(sources) ? [] : {}
    for (const key in sources) {
      result[key] = sources[key]()
    }
    return project ? project(result) : result
  })
}
