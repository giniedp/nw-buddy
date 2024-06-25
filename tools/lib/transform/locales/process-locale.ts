import path from 'node:path'
import { z } from 'zod'
import { readJSONFile } from '../../utils/file-utils'
import { logger } from '../../utils/logger'
import { withProgressBar } from '../../utils/progress'

const schema = z.record(
  z.string(),
  z.object({
    value: z.string().or(z.number()),
  }),
)

export async function processLocale(files: string[]) {
  const result: Record<string, Record<string, string | number>> = {}
  await withProgressBar({ label: 'Processing Locale', tasks: files }, async (file, i, log) => {
    const locale = path.basename(path.dirname(file))
    const data = await readJSONFile(file, schema)
    if (!result[locale]) {
      result[locale] = {}
    }
    const dict = result[locale]
    for (let key in data) {
      const value = data[key].value
      key = key.toLowerCase().replace(/^@/, '') // remove @ from keys (e.g. @name -> name)
      if (dict[key]) {
        if (dict[key] !== value) {
          logger.warn(`[${locale}] Duplicate key: ${key}`)
        }
        continue
      }
      dict[key] = value
    }
  })

  await withProgressBar({ label: 'Sorting Locale', tasks: Object.keys(result) }, async (locale) => {
    const dict = result[locale]
    result[locale] = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b)))
  })
  return result
}
