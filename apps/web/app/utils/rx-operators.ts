import { groupBy, isEqual } from "lodash";
import { distinctUntilChanged, map, pipe } from "rxjs";

export function mapFilter<T>(predicate: (value: T, index: number, array: T[]) => boolean) {
  return map<T[], T[]>((list) => list?.filter(predicate))
}

export function mapFind<T>(predicate: (value: T, index: number, array: T[]) => boolean) {
  return map<T[], T>((list) => list?.find(predicate))
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
