import { ColumnType, Datasheet } from './types'
export interface DatasheetHeader {
  type: string
  name: string
  fields: Record<string, 'string' | 'boolean' | 'number'>
}

export interface DatasheetFile<T = unknown> {
  header: DatasheetHeader
  rows: T[]
}

export function datasheetRows(sheet: Datasheet) {
  const result: any[] = []
  for (const row of sheet.rows) {
    const record = {}
    for (let i = 0; i < sheet.header.length; i++) {
      const type = sheet.header[i].type
      const key = sheet.header[i].name
      const value = row[i]
      switch (type) {
        case ColumnType.String: {
          if (value) {
            record[key] = value
          }
          break
        }
        default: {
          record[key] = value
          break
        }
      }
    }
    result.push(record)
  }
  return result
}



export function datasheetHeader(sheet: Datasheet): DatasheetHeader {
  const fields: Record<string, 'string' | 'boolean' | 'number'> = {}
  for (const column of sheet.header) {
    switch (column.type) {
      case ColumnType.String: {
        fields[column.name] = 'string'
        break
      }
      case ColumnType.Boolean: {
        fields[column.name] = 'boolean'
        break
      }
      case ColumnType.Number: {
        fields[column.name] = 'number'
        break
      }
    }
  }
  return {
    type: sheet.type,
    name: sheet.name,
    fields,
  }
}
