import { groupBy, uniq } from 'lodash'

export function generateTableIndex(
  input: Array<{
    file: string
    type: string
    sheetType: string
    sheetName: string
  }>,
) {
  const groups = groupBy(input, (it) => it.sheetType)

  const code: string[] = []
  code.push(`import type {`)
  for (const type of uniq(input.map((it) => it.type).sort())) {
    code.push(`  ${type},`)
  }
  code.push(`} from './types'`)
  code.push('')
  code.push(`export type DataSheetUri<T> = {`)
  code.push(`  uri: string`)
  code.push(`}`)
  code.push('')
  code.push(`export const DATASHEETS = {`)
  for (const sheetType of Object.keys(groups).sort()) {
    code.push(`  ${escapedName(sheetType)}: {`)
    groups[sheetType].sort((a, b) => a.sheetName.localeCompare(b.sheetName))
    for (const { sheetName, type, file } of groups[sheetType]) {
      const url = file.replace(/\\/g, '/')
      code.push(`    ${escapedName(sheetName)}: <DataSheetUri<${type}>>{ uri: '${url}' },`)
    }
    code.push(`  },`)
  }
  code.push(`}`)

  return code.join('\n')
}

function escapedName(name: string) {
  if (name.match(/^[a-z_][a-z0-9_]*$/i)) {
    return name
  }
  return `'${name}'`
}
