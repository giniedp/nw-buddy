import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_ITEMS } from './constants'
import { ItemInstanceRecord } from './types'

@Injectable({ providedIn: 'root' })
export class ItemInstancesDB extends DBTable<ItemInstanceRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<ItemInstanceRecord>(DBT_ITEMS)

  public get events() {
    return this.table.events
  }

}
