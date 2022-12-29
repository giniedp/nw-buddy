import * as path from 'path'
import { glob, processArrayWithProgress } from '../utils'
import { readFile } from 'fs/promises'

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

export async function loadDatatables({ inputDir, patterns, remap, rewrite }: LoadDataTablesOptions) {
  const input = pathToDatatables(inputDir)
  patterns = patterns || [path.join('**', '*.json')]
  patterns = patterns.map((it) => path.join(input, it))

  const files = new Set<string>()
  for (const pattern of patterns) {
    for (const file of await glob(pattern)) {
      files.add(file)
    }
  }
  const result: Array<DataTableSource> = []
  await processArrayWithProgress(Array.from(files), async (file) => {
    const content = await readFile(file, 'utf-8')
    const json = JSON.parse(content) as Array<any>
    result.push({
      file: file,
      relative: path.relative(input, file),
      data: json,
    })
  })
  await processArrayWithProgress(result, async (table) => {
    applyRemap(table.file, table.data, remap)
    applyRewrite(table.file, table.data, rewrite, result)
  })

  return result
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

function applyRemap(file: string, data: any[], fileRules: RemapFile[]) {
  if (!fileRules?.length) {
    return
  }

  fileRules
    .filter((it) => doesMatch(file, it.file))
    .forEach(({ rules: remap }) => {
      data.forEach((obj) => {
        Object.entries(obj).forEach(([key, value]) => {
          const found = remap.find((rule) => doesMatch(key, rule.match))
          if (found) {
            obj[key] = found.remap(value)
          }
        })
      })
    })
}

function applyRewrite(file: string, data: any[], fileRules: RewriteFile[], tables: DataTableSource[]) {
  if (!fileRules?.length) {
    return
  }

  const getTables = (match: MatchRule) => {
    return tables
      .filter((it) => doesMatch(it.file, match))
      .map((it) => it.data)
      .flat(1)
  }
  fileRules
    .filter((it) => doesMatch(file, it.file))
    .forEach(({ rules }) => {
      data.forEach((obj) => {
        rules.forEach((rule) => rule(obj, { getTables }))
      })
    })
}

export function walkStringProperties(
  tables: DataTableSource[],
  fn: (key: string, value: string, obj: any, file: string) => void
) {
  for (let { file, data } of tables) {
    if (!data) {
      return true
    }
    if (!Array.isArray(data)) {
      data = [data]
    }
    for (const entry of data) {
      Object.entries(entry).forEach(([key, value]) => {
        if (typeof value === 'string') {
          fn(key, value, entry, file)
        }
      })
    }
  }
}
