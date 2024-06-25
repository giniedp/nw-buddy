import { z } from 'zod'
import { DatasheetFile, DatasheetHeader } from '../../file-formats/datasheet/converter'
import { readJSONFile } from '../../utils/file-utils'
import { withProgressBar } from '../../utils/progress'
import { TableTransform } from './dsl'
import { TRANSFORM_RULES } from './table-rules'

const schema = z.object({
  header: z.object({
    type: z.string(),
    name: z.string(),
    fields: z.record(z.any()),
  }),
  rows: z.array(z.record(z.unknown())),
})

export async function processTables({ inputDir, files }: { inputDir: string; files: string[] }) {
  const tables: Record<string, DatasheetFile<any>> = {}

  await withProgressBar({ label: 'Reading Tables', tasks: files }, async (file) => {
    const table = await readJSONFile(file, schema)
    tables[file] = table as any
  })
  await withProgressBar({ label: 'Processing Tables', tasks: files }, async (file) => {
    const table = tables[file]
    for (const rule of TRANSFORM_RULES) {
      if (!shouldRuleApply(rule, table.header)) {
        continue
      }
      for (const fn of rule.operations) {
        if (Array.isArray(fn)) {
          for (const row of table.rows) {
            for (const op of fn) {
              op(row)
            }
          }
        } else {
          fn(table.rows, { inputDir, tables })
        }
      }
    }
  })
  return tables
}

function shouldRuleApply(rule: TableTransform, meta: Partial<DatasheetHeader>) {
  if (rule.name && !match(rule.name, meta.name)) {
    return false
  }
  if (rule.type && !match(rule.type, meta.type)) {
    return false
  }
  return true
}

function match(test: string | RegExp, value: string) {
  if (typeof test === 'string') {
    return test === value
  }
  return test.test(value)
}
