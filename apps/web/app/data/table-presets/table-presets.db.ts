import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_TABLE_PRESETS, DBT_TABLE_STATES } from './constants'
import { TablePresetRecord, TableStateRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TablePresetDB extends DBTable<TablePresetRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<TablePresetRecord>(DBT_TABLE_PRESETS)
}

@Injectable({ providedIn: 'root' })
export class TableStateDB extends DBTable<TableStateRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<TableStateRecord>(DBT_TABLE_STATES)
}
