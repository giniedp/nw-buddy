import * as path from 'path'
import { glob, withProgressBar, writeJSONFile } from '../../utils'
import { walkJsonStrings } from '../../utils/walk-json-object'
import { normalizeLocaleKey, readLocaleFile } from './utils'

export async function importLocales({
  input,
  output,
  tables,
  preserveKeys,
}: {
  input: string
  output: string
  tables: Array<Object>
  preserveKeys?: Array<string | RegExp>
}) {
  const keys = extractKeys(tables)
  const regs: Array<RegExp> = []
  for (const key of preserveKeys || []) {
    if (typeof key === 'string') {
      keys.add(normalizeLocaleKey(key))
    } else {
      regs.push(key)
    }
  }
  const locales = await readLocales(input, keys, regs)
  await writeLocales(output, locales)
  return locales
}

function extractKeys(tables: Object[]) {
  const result = new Set<string>()
  walkJsonStrings(tables, (key, value, obj) => {
    if (value?.startsWith('@')) {
      obj[key] = value.substring(1) // keep original case in object
      result.add(normalizeLocaleKey(value)) // use lower case for dictionary
    }
  })
  return result
}

async function readLocales(inputDir: string, keys: Set<string>, regs: RegExp[]) {
  const pattern = path.join(inputDir, '**', '*.loc.json')
  const files = await glob(pattern)
  const result = new Map<string, Record<string, string>>()

  await withProgressBar({ barName: 'Load', tasks: files }, async (file, _, log) => {
    log(file)
    const lang = path.basename(path.dirname(file))
    const bucket = result.get(lang) || {}
    for await (let { key, value } of readLocaleFile(file)) {
      key = normalizeLocaleKey(key)
      if (keys.has(key) || regs.some((it) => it.test(key))) {
        bucket[key] = value
      }
    }
  })
  return result
}

async function writeLocales(output: string, locales: Map<string, Record<string, string>>) {
  const tasks = Array.from(locales.entries()).map(([locale, data]) => {
    return {
      file: path.join(output, `${locale}.json`),
      data: data,
    }
  })
  await withProgressBar({ barName: 'Write', tasks: tasks }, async ({ file, data }) => {
    await writeJSONFile(data, file, { createDir: true })
  })
}
