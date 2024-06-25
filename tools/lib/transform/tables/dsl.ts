import { DatasheetFile } from '../../file-formats/datasheet/converter'

export type TableOpFn = (
  table: TableRow[],
  options: { inputDir: string; tables: Record<string, DatasheetFile<any>> },
) => void
export type TableRow = Record<string, unknown>
export type TableRowOpFn = (row: TableRow) => void

export interface TableTransform {
  name: string | RegExp
  type: string | RegExp
  operations: Array<TableOpFn | Array<TableRowOpFn>>
}

export function transformRule(
  options: { name: string | RegExp } | { type: string | RegExp } | { name: string | RegExp; type: string | RegExp },
  ...operations: Array<TableOpFn | Array<TableRowOpFn>>
): TableTransform {
  return {
    name: options['name'],
    type: options['type'],
    operations,
  }
}

function* eachKey(object: any, keys: Array<string | RegExp>) {
  for (const key of keys) {
    let props: string[] = null
    if (key instanceof RegExp) {
      props = Object.keys(object).filter((it) => key.test(it))
    } else {
      props = key in object ? [key] : []
    }
    for (const prop of props) {
      yield prop
    }
  }
}

export function mapProp(
  key: string | string[] | RegExp | RegExp[],
  map: (value: any, key: string) => any,
): TableRowOpFn {
  const keys = Array.isArray(key) ? key : [key]
  return (object) => {
    for (const key of eachKey(object, keys)) {
      object[key] = map(object[key], key)
    }
  }
}

export function renameProp(
  key: string | string[] | RegExp | RegExp[],
  map: (value: any, key: string) => any,
): TableRowOpFn {
  const keys = Array.isArray(key) ? key : [key]
  return (object) => {
    for (const key of eachKey(object, keys)) {
      const newKey = map(object[key], key)
      if (newKey === key) {
        continue
      }

      if (newKey) {
        object[newKey] = object[key]
      } else {
        delete object[key]
      }
    }
  }
}

export function deleteProp(
  key: string | string[] | RegExp | RegExp[],
  predicate?: (value: any) => boolean,
): TableRowOpFn {
  const keys = Array.isArray(key) ? key : [key]
  return (object) => {
    for (const key of eachKey(object, keys)) {
      if (!predicate || predicate(object[key])) {
        delete object[key]
      }
    }
  }
}

export function splitToArray(separator: string | RegExp, map?: (token: string) => string) {
  return (value: any) => {
    if (typeof value === 'string') {
      return value.split(separator).map(map || ((it) => it))
    }
    return value
  }
}

export function mapPropToArray({
  separator,
  keys,
  map,
}: {
  separator: string | RegExp
  keys: string[] | RegExp[]
  map?: (token: string) => string
}): TableRowOpFn {
  return mapProp(keys, splitToArray(separator, map))
}

export function tableFilePattern(glob: string | string[]) {
  return (Array.isArray(glob) ? glob : [glob]).map((it) => {
    if (it.endsWith('.json')) {
      return it
    }
    return `${it}.json`
  })
}
