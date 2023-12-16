import { z } from 'zod'
import { crc32 } from '../../utils/crc-32'
import { glob, readJSONFile, writeJSONFile } from '../../utils/file-utils'

export async function createCrcFile({ values, targetFile }: { values: string[]; targetFile: string }) {
  const entries = values.map((it) => {
    const value = it.toLowerCase()
    return [crc32(value), value] as const
  })
  return writeJSONFile(entries, { target: targetFile })
}

export async function readAndExtractCrcValues<T>({
  files,
  extract,
  schema,
}: {
  files: string[]
  extract: (row: T) => string | string[]
  schema?: z.Schema<T[]>
}) {
  const result: Record<string, string> = {}
  for (const file of await glob(files)) {
    const rows = await readJSONFile(file, schema)
    for (const row of rows) {
      const values = extract(row)
      if (typeof values === 'string') {
        result[crc32(values)] = values
      } else if (Array.isArray(values)) {
        for (const value of values) {
          result[crc32(value)] = value
        }
      }
    }
  }
  return result
}
