import { match as minimatch } from 'minimatch'
import * as path from 'path'
import { glob, readJSONFile, withProgressBar } from '../../utils'
import { TABLE_IMPORT_RULES } from './import-rules'
import { TableRow, TransformContext, tableFilePattern } from './types'
import { uniq } from 'lodash'

export function pathToDatatables(inputDir: string) {
  return path.join(inputDir, 'sharedassets', 'springboardentitites', 'datatables')
}

export async function importDatatables(inputDir: string, rules = TABLE_IMPORT_RULES) {
  const tablesDir = pathToDatatables(inputDir)
  const patterns = rules
    .map((it) => it.glob)
    .flat()
    .map((it) => path.join(tablesDir, it))

  const files = await glob(patterns).then((files) => uniq(files))
  const tables = new Map<string, TableRow[]>()

  await withProgressBar({ barName: 'Read', tasks: Array.from(files) }, async (file, _, log) => {
    const key = path.relative(tablesDir, file)
    log(key)
    const data = await readJSONFile<TableRow[]>(file)
    tables.set(key, data)
  })

  const tablesFiles = Array.from(tables.keys())
  await withProgressBar({ barName: 'Transform', tasks: rules }, async (input, index, log) => {
    const toProcess = new Set<string>()
    for (const pattern of input.glob) {
      let didMatch = false
      for (const file of tablesFiles) {
        if (minimatch([file], pattern).length) {
          toProcess.add(file)
          didMatch = true
        }
      }
      if (!didMatch) {
        throw new Error(`No tables found for ${pattern}`)
      }
    }

    if (!input.operations?.length) {
      return
    }

    const context: TransformContext = {
      current: null,
      inputDir,
      tables,
      getTable: (match) => {
        const pattern = tableFilePattern(match)
        for (const [file, table] of tables.entries()) {
          if (pattern.some((it) => minimatch([file], it).length)) {
            return table
          }
        }
        throw new Error(`No table found for ${match}`)
      },
    }

    for (const operation of input.operations) {
      for (const file of toProcess) {
        log(file)
        const table = tables.get(file)
        context.current = file
        if (typeof operation === 'function') {
          operation(table, context)
        } else {
          for (const op of operation) {
            for (const row of table) {
              op(row, context)
            }
          }
        }
      }
    }
  })

  return Array.from(tables.entries()).map(([file, data]) => {
    return {
      file,
      data,
    }
  })
}
