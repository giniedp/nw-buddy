import { ColumnState } from '@ag-grid-community/core'
import { AppDbRecord } from '../app-db'

export interface TablePreset {
  filter: unknown
  columns: ColumnState[]
}

export interface TablePresetRecord extends TablePreset, AppDbRecord {
  /**
   * Name of the gearset
   */
  name: string
  /**
   * The table key, acts as scope
   */
  key: string
}

export interface TableStateRecord extends AppDbRecord {
  columns: ColumnState[]
  pinnedTop: Array<string | number>
  pinnedBottom: Array<string | number>
}
