import { DataSheetUri } from '@nw-data/generated'
import { uniq } from 'lodash'
import { CaseInsensitiveMap } from '../common/utils/caseinsensitive-map'

export interface DataLoader {
  fetch(url: string): Promise<Response>
  fetchJson<T>(uri: string): Promise<T>
  loadDatasheet<T>(url: DataSheetUri<T>): Promise<T[]>
  loadDatasheets<T>(collection: Record<string, DataSheetUri<T>>): Array<Promise<Array<T & { $source: string }>>>
}

export type Table<T> = () => Promise<T[]>
export type TableSource<T> = () => Promise<T[]> | Array<Promise<T[]>>
export type TableTransform<T, R> = (data: T[]) => R[]
export type TableMapreduce<T, M, R> = {
  map: (data: T[]) => M[]
  reduce: (data: M[]) => R[]
}

export type PrimaryIndex<K, T> = () => Promise<Map<K, T>>
export type SecondaryIndex<K, T> = () => Promise<Map<K, T[]>>
export type IndexLookup<K, T> = (key: K) => Promise<T | undefined>

export function table<T, R>(source: TableSource<T>, transform: TableTransform<T, R>): Table<R>
export function table<T>(source: TableSource<T>): Table<T>
export function table<T>(source: TableSource<T>, transform?: TableTransform<T, T>): Table<T> {
  return cached(async () => {
    return Promise.all(makeArray(source()))
      .then((it) => it.flat(1))
      .then((it) => (transform ? transform(it) : it))
  })
}

export function tableSelector<T, R>(source: TableSource<T>, transform: TableTransform<T, R>): Table<R>
export function tableSelector<T>(source: TableSource<T>): Table<T>
export function tableSelector<T>(source: TableSource<T>, transform?: TableTransform<T, T>): Table<T> {
  return cached(async () => {
    return Promise.all(makeArray(source()))
      .then((it) => it.flat(1))
      .then((it) => (transform ? transform(it) : it))
  })
}

export function primaryIndex<T, K extends keyof T>(table: Table<T>, key: K): PrimaryIndex<T[K], T>
export function primaryIndex<T, K>(table: Table<T>, keyFn: (it: T) => K): PrimaryIndex<K, T>
export function primaryIndex<T>(table: Table<T>, key: any): PrimaryIndex<any, T> {
  console.assert(table != null, 'Table is not defined')
  return cached(async () => {
    return table().then((items) => createPrimaryIndex(items, key))
  })
}

export function secondaryIndex<T, K extends keyof T>(
  table: Table<T>,
  key: K,
): SecondaryIndex<T[K] extends Array<infer R> ? R : T[K], T>
export function secondaryIndex<T, K>(table: Table<T>, keyFn: (it: T) => K | K[]): SecondaryIndex<K, T>
export function secondaryIndex<T>(table: Table<T>, key: any): SecondaryIndex<any, T> {
  console.assert(table != null, 'Table is not defined')
  return cached(async () => {
    return table().then((items) => createSecondaryIndex(items, key))
  })
}

export function indexLookup<T, K>(index: PrimaryIndex<K, T>): IndexLookup<K, T>
export function indexLookup<T, K>(index: SecondaryIndex<K, T>): IndexLookup<K, T[]>
export function indexLookup<T, K>(index: PrimaryIndex<K, T | T[]>): IndexLookup<K, T | T[]> {
  console.assert(index != null, 'Index is not defined')
  return async (key: any) => {
    if (key == null) {
      return null
    }
    return index().then((it) => it?.get(key))
  }
}

function createPrimaryIndex<T, K extends keyof T>(list: T[], key: K): Map<T[K], T>
function createPrimaryIndex<T, K>(list: T[], fn: (it: T) => K): Map<K, T>
function createPrimaryIndex<T>(list: T[], key: string | ((it: any) => string | string[])) {
  const fn = typeof key === 'string' ? (it: any) => it[key] : key
  const result = new CaseInsensitiveMap<any, T>()
  for (const item of list) {
    const key = fn(item)
    if (key == null) {
      continue
    }
    if (!result.has(key)) {
      result.set(key, item)
    } else {
      console.warn(`Duplicate key: ${key}`, item)
    }
  }
  return result
}

function createSecondaryIndex<T, K extends keyof T>(list: T[], key: K): Map<T[K], T[]>
function createSecondaryIndex<T, K>(list: T[], fn: (it: T) => K | K[]): Map<K, T[]>
function createSecondaryIndex<T>(list: T[], key: string | ((it: any) => string | string[])) {
  const fn = typeof key === 'string' ? (it: any) => it[key] : key
  const result = new CaseInsensitiveMap<any, T[]>()
  for (const item of list) {
    const keys = uniq(makeArray(fn(item)))
    for (const key of keys) {
      if (key == null) {
        continue
      }
      if (!result.has(key)) {
        result.set(key, [])
      }
      result.get(key).push(item)
    }
  }
  return result
}

function cached<T>(fn: () => T) {
  let result: T | undefined
  return () => {
    if (result === undefined) {
      result = fn()
    }
    return result
  }
}

function makeArray<T>(it: T | T[]): T[] {
  if (Array.isArray(it)) {
    return it
  }
  if (it) {
    return [it]
  }
  return []
}
