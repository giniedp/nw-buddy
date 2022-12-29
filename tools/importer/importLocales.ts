import * as path from 'path'
import { glob, processArrayWithProgress, writeJSONFile } from '../utils'
import { readFile } from 'fs/promises'

import { DataTableSource, walkStringProperties } from './loadDatatables'

export async function importLocales({
  input,
  output,
  tables,
  preserveKeys
}: {
  input: string
  output: string
  tables: Array<DataTableSource>,
  preserveKeys?: Array<string | RegExp>
}) {
  const keys = extractKeys(tables)
  const regs: Array<RegExp> = []
  for (const key of preserveKeys || []) {
    if (typeof key === 'string') {
      keys.add(normalizeKey(key))
    } else {
      regs.push(key)
    }
  }
  const locales = await loadLocales(input, keys, regs)
  await writeLocales(output, locales)
  return locales
}

function extractKeys(tables: DataTableSource[]) {
  const result = new Set<string>()
  walkStringProperties(tables, (key, value, obj) => {
    if (value?.startsWith('@')) {
      obj[key] = value.substring(1)   // keep original case in object
      result.add(normalizeKey(value)) // use lower case for dictionary
    }
  })
  return result
}

async function loadLocales(input: string, keys: Set<string>, regs: RegExp[]) {
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
      if (keys.has(key) || regs.some((it) => it.test(key))) {
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
