export type TableOpFn = (table: TableRow[], context: TransformContext) => TableRow[]
export type TableRow<T = any> = Record<string, T>
export type TableRowOpFn = (row: TableRow, context: TransformContext) => void

export interface TransformContext {
  current: string
  inputDir: string
  tables: Map<string, TableRow[]>
  getTable: (glob: string | string[]) => TableRow[]
}

export interface TableInput {
  glob: string[]
  operations: Array<TableOpFn | Array<TableRowOpFn>>
}

export function tableSource(
  glob: string | string[],
  ...operations: Array<TableOpFn | Array<TableRowOpFn>>
): TableInput {
  return {
    glob: tableFilePattern(glob),
    operations,
  }
}

function *eachKey(object: any, keys: Array<string | RegExp>) {
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
  return (object, ctx) => {
    for (const key of eachKey(object, keys)) {
      const newKey = map(object[key], key)
      if (newKey === key) {
        continue
      }
      if (newKey in object) {
        throw new Error(`Duplicate property ${newKey} in table ${ctx.current}`)
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
  return (object, ctx) => {
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
