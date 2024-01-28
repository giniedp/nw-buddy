import { Injectable, inject } from '@angular/core'
import { Table } from 'dexie'
import { injectAppDB } from './db'
import { GearsetsDB } from './gearsets'
import { ItemInstancesDB } from './items'

export type ExportedDB = { name: string; tables: ExportedTable[] }
export type ExportedTable = { name: string; rows: Object[] }

@Injectable({ providedIn: 'root' })
export class DbService {
  public readonly db = injectAppDB()
  public readonly items = inject(ItemInstancesDB)
  public readonly gearsets = inject(GearsetsDB)

  public async export(): Promise<ExportedDB> {
    await this.ensureOpen()
    const db = this.db
    return await db.transaction('r', db.tables, async () => {
      return {
        name: db.name,
        tables: await Promise.all(db.tables.map((table) => this.exportTable(table))),
      }
    })
  }

  public async import(data: ExportedDB) {
    if (!data || data.name !== this.db.name) {
      return
    }
    if (!data.tables || !Array.isArray(data.tables) || !data.tables.length) {
      return
    }
    await this.ensureOpen()
    const db = this.db
    return db.transaction('rw', db.tables, async () => {
      for (const table of data.tables) {
        await this.importTable(table)
      }
    })
  }

  private async exportTable(table: Table): Promise<ExportedTable> {
    return {
      name: table.name,
      rows: await table.toArray(),
    }
  }

  private async importTable(data: ExportedTable) {
    if (!data || !Array.isArray(data.rows) || !data.rows.length) {
      return
    }
    if (!this.db.tables.some((it) => it.name === data.name)) {
      return
    }
    const table = this.db.table(data.name)
    await table.clear()
    table.bulkAdd(data.rows)
  }

  private async ensureOpen() {
    if (!this.db.isOpen()) {
      await this.db.open()
    }
  }
}
