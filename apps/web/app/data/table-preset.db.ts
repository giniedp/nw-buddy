import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { APP_DB } from './db'
import { DBTable } from './db-table'
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

export const DBT_TABLE_PRESETS = 'table-presets'
@Injectable({ providedIn: 'root' })
export class TablePresetDB extends DBTable<TablePresetRecord> {
  public static readonly tableName = DBT_TABLE_PRESETS
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_TABLE_PRESETS)
  }
}

export const DBT_TABLE_STATES = 'table-states'
@Injectable({ providedIn: 'root' })
export class TableStateDB extends DBTable<TableStateRecord> {
  public static readonly tableName = DBT_TABLE_STATES
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_TABLE_STATES)
  }
}
