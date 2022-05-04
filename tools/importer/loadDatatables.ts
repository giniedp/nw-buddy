import * as path from 'path'
import { glob, processArrayWithProgress } from '../utils'
import { readFile } from 'fs/promises'

export interface DatatableSource {
  file: string,
  relative: string,
  data: any,
}

export async function loadDatatables({ inputDir, patterns }: { inputDir: string, patterns?: string[] }) {
  const input = path.join(inputDir, 'sharedassets', 'springboardentitites', 'datatables')
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
    const json = JSON.parse(content)
    result.push({
      file: file,
      relative: path.relative(input, file),
      data: json,
    })
  })
  return result
}

export function walkStringProperties(tables: DatatableSource[], fn: (key: string, value: string, obj: any, file: string ) => void) {
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
