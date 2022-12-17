import { groupBy, isEqual } from "lodash";
import { distinctUntilChanged, map, pipe, tap } from "rxjs";

export function mapProp<T, K extends keyof T>(prop: K) {
  return map<T, T[K]>((it) => it?.[prop])
}

export function mapPropTruthy<T, K extends keyof T>(prop: K) {
  return map<T, boolean>((it) => !!it?.[prop])
}

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

export function tapDebug<T>(tag: string, transform?: (it: T) => any) {
  return tap<T>({
    next(value) {
      const data = transform ? transform(value) : value
      console.log(`%c[${tag}: Next]`, "background: #009688; color: #fff; padding: 2px; font-size: 10px;", data)
    },
    error(error) {
      console.log(`%[${tag}: Error]`, "background: #E91E63; color: #fff; padding: 2px; font-size: 10px;", error)
    },
    complete() {
      console.log(`%c[${tag}]: Complete`, "background: #00BCD4; color: #fff; padding: 2px; font-size: 10px;")
    }
  })
}
