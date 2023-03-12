import { sortBy } from "lodash"

export function generateTableColumns(samples: Map<string, any[]>) {
  const result: string[] = []
  for (const [type, data] of sortBy(Array.from(samples.entries()), ([type]) => type) ) {
    const columns = new Map<string, string>()
    for (const obj of data.flat(1)) {
      for (const [key, value] of Object.entries(obj)) {
        columns.set(key, Array.isArray(value) ? '[]' : typeof value)
      }
    }
    result.push(`export const COLS_${type.toUpperCase()} = {`)
    for (const [key, type] of sortBy(Array.from(columns.entries()), ([key, type]) => key) ) {
      result.push(`  "${key}": "${type}",`)
    }
    result.push(`}`)
  }
  return result.join('\n')
}
