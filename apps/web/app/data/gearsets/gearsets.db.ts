import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_GEARSETS } from './constants'
import { GearsetRecord } from './types'

@Injectable({ providedIn: 'root' })
export class GearsetsDB extends DBTable<GearsetRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<GearsetRecord>(DBT_GEARSETS)
}
