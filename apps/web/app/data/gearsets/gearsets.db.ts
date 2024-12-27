import { inject, Injectable, Injector } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_GEARSETS } from './constants'
import { GearsetRecord } from './types'
import { SyncService } from '../supabase'

@Injectable({ providedIn: 'root' })
export class GearsetsDB extends DBTable<GearsetRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<GearsetRecord>(DBT_GEARSETS)

  constructor() {
    super()

    Injector.create({
      providers: [SyncService],
      parent: inject(Injector),
    })
      .get(SyncService)
      .connectTableSync(this.table)
  }
}
