import * as path from 'path'
import { glob, readJSONFile, withProgressBar } from '../../utils'
import { walkJsonObjects } from '../../utils/walk-json-object'

export type DataTable = Array<Record<string, any>>

export interface DataTableSource {
  file: string
  relative: string
  data: DataTable
}

export interface LoadDataTablesOptions {
  inputDir: string
  patterns?: string[]
  remap?: RemapFile[]
  rewrite?: RewriteFile[]
}

export interface RemapFile {
  file: MatchRule
  rules: RemapRule[]
}

export interface RemapRule {
  match: MatchRule
  remap: (value: any) => any
}

export interface RewriteFile {
  file: MatchRule
  rules: RewriteRule[]
}
export type MatchRule = string | string[] | RegExp | ((value: string) => boolean)

export type RewriteRule = (input: Record<string, any>, opts: { getTables: (match: MatchRule) => DataTable }) => void

export function pathToDatatables(inputDir: string) {
  return path.join(inputDir, 'sharedassets', 'springboardentitites', 'datatables')
}

export async function importDatatables({ inputDir, patterns, remap, rewrite }: LoadDataTablesOptions) {
  const input = pathToDatatables(inputDir)
  patterns = patterns || [path.join('**', '*.json')]
  patterns = patterns.map((it) => path.join(input, it))

  const files = new Set<string>()
  for (const pattern of patterns) {
    for (const file of await glob(pattern)) {
      files.add(file)
    }
  }
  const tables: Array<DataTableSource> = []

  await withProgressBar({ barName: 'Load', tasks: Array.from(files) }, async (file, _, log) => {
    log(file)
    const json = await readJSONFile<Array<any>>(file)
    applyRemap(file, json, remap)
    tables.push({
      file: file,
      relative: path.relative(input, file),
      data: json,
    })
  })

  await withProgressBar({ barName: 'Rewrite', tasks: tables }, async (table, _, log) => {
    return new Promise((resolve) => {
      log(table.file)
      applyRewrite(table.file, table.data, rewrite, tables)
      setTimeout(resolve)
    })
  })

  return tables
}

export function splitToArrayRule({ separator, properties }: { separator: string; properties: MatchRule }): RemapRule {
  return {
    match: properties,
    remap: (value: string) => value && value.split(separator),
  }
}

function doesMatch(value: string, matcher: MatchRule) {
  if (typeof matcher === 'string') {
    return matcher === value
  }
  if (Array.isArray(matcher)) {
    return matcher.some((it) => it === value)
  }
  if (matcher instanceof RegExp) {
    return matcher.test(value)
  }
  if (typeof matcher === 'function') {
    return matcher(value)
  }
  return false
}

function applyRemap<T>(file: string, data: T, remapRules: RemapFile[]): T {
  remapRules = remapRules || []
  remapRules
    .filter((it) => doesMatch(file, it.file))
    .forEach(({ rules: remap }) => {
      walkJsonObjects(data, (obj) => {
        for (const key in obj) {
          const found = remap.find((rule) => doesMatch(key, rule.match))
          if (found) {
            obj[key] = found.remap(obj[key])
          }
        }
      })
    })
  return data
}

function applyRewrite(file: string, data: any[], rewriteRules: RewriteFile[], tables: DataTableSource[]) {
  if (!rewriteRules?.length) {
    return
  }

  const getTables = (match: MatchRule) => {
    return tables
      .filter((it) => doesMatch(it.file, match))
      .map((it) => it.data)
      .flat(1)
  }
  rewriteRules
    .filter((it) => doesMatch(file, it.file))
    .forEach(({ rules }) => {
      data.forEach((obj) => {
        rules.forEach((rule) => rule(obj, { getTables }))
      })
    })
}
