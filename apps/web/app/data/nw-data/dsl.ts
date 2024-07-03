import { Signal, isSignal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { uniq } from 'lodash'
import { Observable, defer, isObservable, map, of, shareReplay } from 'rxjs'
import { CaseInsensitiveMap, combineLatestOrEmpty, selectStream } from '~/utils'

function createIndex<T, K extends keyof T>(list: T[], id: K): Map<T[K], T>
function createIndex<T>(list: T[], fn: (it: T) => string): Map<string, T>
function createIndex(list: any[], id: string | ((it: any) => string)) {
  const fn = typeof id === 'string' ? (it: any) => it[id] : id
  const result = new CaseInsensitiveMap()
  for (const item of list) {
    result.set(fn(item), item)
  }
  return result
}

function createIndexGroup<T, K extends keyof T>(list: T[], id: K): Map<string, T[]>
function createIndexGroup<T>(list: T[], fn: (it: T) => string | string[]): Map<string, T[]>
function createIndexGroup<T>(list: T[], id: string | ((it: T) => string | string[])): Map<string, T[]> {
  const fn = typeof id === 'string' ? (item: any) => item?.[id] : id
  const result = new CaseInsensitiveMap<string, Array<T>>()
  for (const item of list) {
    const keys = uniq(makeArray(fn(item) || []))
    for (const key of keys) {
      if (!result.has(key)) {
        result.set(key, [])
      }
      result.get(key).push(item)
    }
  }
  return result
}

function makeArray<T>(it: T | T[]): T[] {
  if (Array.isArray(it)) {
    return it
  }
  return [it]
}

export function annotate<T extends Object, K extends string>(key: K, value: string) {
  return map<Array<T>, Array<T & { [key in K]?: string }>>((items: T[]) => {
    for (const item of items) {
      item[key as any] = value
    }
    return items as any
  })
}

export function table<T>(source: () => Observable<T[]> | Array<Observable<T[]>>): Observable<T[]>
export function table<T, R>(
  source: () => Observable<T[]> | Array<Observable<T[]>>,
  transform: (data: T[]) => R[],
): Observable<R[]>
export function table(source: () => Observable<any[]> | Array<Observable<any[]>>, transform?: (data: any[]) => any[]) {
  return defer(() => combineLatestOrEmpty(makeArray(source())))
    .pipe(map((it) => it.flat(1)))
    .pipe(map(transform || ((it) => it)))
    .pipe(shareReplay(1))
}

export function tableLookup<K, T>(source: () => Observable<Map<K, T>>) {
  return (id: K | Observable<K> | Signal<K>) => {
    return selectStream(
      {
        data: defer(source),
        id: isObservable(id) ? id : isSignal(id) ? toObservable(id) : of(id),
      },
      ({ data, id }) => {
        return id != null ? data.get(id) : null
      },
    )
  }
}

export function tableIndexBy<T, K extends keyof T>(source: () => Observable<T[]>, key: K): Observable<Map<T[K], T>>
export function tableIndexBy<T>(source: () => Observable<T[]>, keyFn: (it: T) => string): Observable<Map<string, T>>
export function tableIndexBy(source: () => Observable<any[]>, key: string | ((it: any) => string)) {
  return defer(source)
    .pipe(map((items) => createIndex(items, key as any)))
    .pipe(shareReplay(1))
}

export function tableGroupBy<T, K extends keyof T>(source: () => Observable<T[]>, key: K): Observable<Map<string, T[]>>
export function tableGroupBy<T>(
  source: () => Observable<T[]>,
  keyFn: (it: T) => string[] | string,
): Observable<Map<string, T[]>>
export function tableGroupBy<T>(
  source: () => Observable<T[]>,
  key: string | ((it: T) => string[] | string),
): Observable<Map<string, T[]>> {
  return defer(source)
    .pipe(map((items) => createIndexGroup(items, key as any)))
    .pipe(shareReplay(1))
}
