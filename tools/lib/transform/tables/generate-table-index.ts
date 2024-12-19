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
  code.push(`  uri: string | string[]`)
  code.push(`}`)
  code.push('')
  code.push(`export const DATASHEETS = {`)
  for (const sheetType of Object.keys(groups).sort()) {
    code.push(`  ${escapedName(sheetType)}: {`)
    const sheets: Record<
      string,
      {
        uris: string[]
        types: string[]
      }
    > = {}

    for (const { sheetName, type, file } of groups[sheetType]) {
      const url = file.replace(/\\/g, '/')
      if (!sheets[sheetName]) {
        sheets[sheetName] = {
          uris: [],
          types: [],
        }
      }
      sheets[sheetName].uris.push(url)
      sheets[sheetName].types.push(type)
    }
    for (const sheetName of Object.keys(sheets).sort((a, b) => a.localeCompare(b))) {
      const uris = uniq(sheets[sheetName].uris)
      const types = uniq(sheets[sheetName].types)
      if (uris.length === 1) {
        code.push(`    ${escapedName(sheetName)}: <DataSheetUri<${types[0]}>>{ uri: '${uris[0]}' },`)
      } else {
        code.push(
          `    ${escapedName(sheetName)}: <DataSheetUri<${types.join(' | ')}>>{`,
          `      uri: ${JSON.stringify(uris)}`,
          `    },`,
        )
      }
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
