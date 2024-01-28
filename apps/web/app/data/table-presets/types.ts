import { ColumnState } from '@ag-grid-community/core'

export interface TablePreset {
  filter: unknown
  columns: ColumnState[]
}

export interface TablePresetRecord extends TablePreset {
  /**
   * ID in database
   */
  id: string
  /**
   * Name of the gearset
   */
  name: string
  /**
   * The table key, acts as scope
   */
  key: string
}

export interface TableStateRecord {
  id: string
  columns: ColumnState[]
  pinnedTop: Array<string | number>
  pinnedBottom: Array<string | number>
}
