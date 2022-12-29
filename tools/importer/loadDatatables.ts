import * as path from 'path'
import { glob, processArrayWithProgress } from '../utils'
import { readFile } from 'fs/promises'

export interface DatatableSource {
  file: string
  relative: string
  data: any
}

export interface LoadDatatablesOptions {
  inputDir: string
  patterns?: string[]
  remap?: RemapFile[]
}

export interface RemapFile {
  file: RegExp | ((file: string) => boolean)
  rules: RemapRule[]
}

export interface RemapRule {
  match: string | string[] | RegExp | ((property: string) => boolean)
  remap: (value: any) => any
}

export type RemapMatcher = string | string[] | RegExp | ((property: string) => boolean)

export function pathToDatatables(inputDir: string) {
  return path.join(inputDir, 'sharedassets', 'springboardentitites', 'datatables')
}

export async function loadDatatables({ inputDir, patterns, remap }: LoadDatatablesOptions) {
  const input = pathToDatatables(inputDir)
  patterns = patterns || [path.join('**', '*.json')]
  patterns = patterns.map((it) => path.join(input, it))

  const files = new Set<string>()
  for (const pattern of patterns) {
    for (const file of await glob(pattern)) {
      files.add(file)
    }
  }
  const result: Array<DatatableSource> = []
  await processArrayWithProgress(Array.from(files), async (file) => {
    const content = await readFile(file, 'utf-8')
    const json = JSON.parse(content) as Array<any>
    applyRemap(file, json, remap)
    result.push({
      file: file,
      relative: path.relative(input, file),
      data: json,
    })
  })
  return result
}

export function splitToArrayRule({ separator, properties }: { separator: string; properties: RemapMatcher }): RemapRule {
  return {
    match: properties,
    remap: (value: string) => value && value.split(separator),
  }
}

function doesMathch(value: string, matcher: string | string[] | RegExp | ((it: string) => boolean)) {
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
    .filter((it) => doesMathch(file, it.file))
    .forEach(({ rules: remap }) => {
      data.forEach((obj) => {
        Object.entries(obj).forEach(([key, value]) => {
          const found = remap.find((rule) => doesMathch(key, rule.match))
          if (found) {
            obj[key] = found.remap(value)
          }
        })
      })
    })
}

export function walkStringProperties(
  tables: DatatableSource[],
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
