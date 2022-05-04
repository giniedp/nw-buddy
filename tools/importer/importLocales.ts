import * as path from 'path'
import { glob, processArrayWithProgress, writeJSONFile } from '../utils'
import { readFile } from 'fs/promises'

import { DatatableSource, walkStringProperties } from './loadDatatables'

export async function importLocales({
  input,
  output,
  tables,
  preserveKeys
}: {
  input: string
  output: string
  tables: Array<DatatableSource>,
  preserveKeys?: string[]
}) {
  const keys = extractKeys(tables)
  for (const key of preserveKeys || []) {
    keys.add(key)
  }
  const locales = await loadLocales(input, keys)
  await writeLocales(output, locales)
}

function extractKeys(tables: DatatableSource[]) {
  const result = new Set<string>()
  walkStringProperties(tables, (key, value, obj) => {
    if (value?.startsWith('@')) {
      obj[key] = normalizeKey(value)
      result.add(obj[key])
    }
  })
  return result
}

async function loadLocales(input: string, keys: Set<string>) {
  const pattern = path.join(input, '**', '*.loc.json')
  const files = await glob(pattern)
  const result = new Map<string, Record<string, string>>()

  await processArrayWithProgress(files, async (file) => {
    const content = await readFile(file, 'utf-8')
    const json = JSON.parse(content)
    const lang = path.basename(path.dirname(file))
    const bucket = result.get(lang) || {}
    result.set(lang, bucket)
    Object.entries(json).forEach(([key, entry]) => {
      key = normalizeKey(key)
      if (keys.has(key)) {
        bucket[key] = entry['value']
      }
    })
  })
  return result
}
async function writeLocales(output: string, locales: Map<string, Record<string, string>>) {
  for (const [locale, data] of Array.from(locales.entries())) {
    await writeJSONFile(data, path.join(output, `${locale}.json`), {
      createDir: true,
    })
  }
}

function normalizeKey(key: string) {
  key = key || ''
  if (key.startsWith('@')) {
    key = key.substring(1)
  }
  return key.toLowerCase()
}
