import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_TRANSMOGS } from './constants'
import { TransmogRecord } from './types'

@Injectable({ providedIn: 'root' })
export class TransmogsDB extends DBTable<TransmogRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<TransmogRecord>(DBT_TRANSMOGS)
  public get events() {
    return this.table.events
  }
}
