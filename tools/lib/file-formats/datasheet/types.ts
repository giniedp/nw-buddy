export interface DatasheetColumn {
  hash: number
  name: string
  type: ColumnType
}
export type DatasheetRow = DatasheetValue[]
export type DatasheetValue = string | number | boolean

export interface Datasheet {
  header: DatasheetColumn[]
  rows: DatasheetRow[]
  type: string
  name: string
}

export const enum ColumnType {
  String = 1,
  Number = 2,
  Boolean = 3,
}
