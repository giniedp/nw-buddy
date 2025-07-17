import { inject, Injectable } from '@angular/core'
import Dexie, { Table } from 'dexie'
import { combineLatest } from 'rxjs'
import { AppDbDexie } from './app-db.dexie'
import { CharacterStore } from './characters'
import { injectAppDB } from './db'
import { GearsetsService } from './gearsets'
import { ItemsService } from './items'
import { SkillTreesService } from './skill-tree'
import { TablePresetsService } from './table-presets'
import { TransmogsService } from './transmogs'
import { BookmarksService } from './bookmarks'
import { AppDbRecord } from './app-db'

export type ExportedDB = { name: string; tables: ExportedTable[] }
export type ExportedTable<T extends AppDbRecord = AppDbRecord> = { name: string; rows: T[] }

@Injectable({ providedIn: 'root' })
export class DbService {
  public readonly db = injectAppDB()
  public readonly characters = inject(CharacterStore)
  public readonly bookmarks = inject(BookmarksService)
  public readonly gearsets = inject(GearsetsService)
  public readonly items = inject(ItemsService)
  public readonly presets = inject(TablePresetsService)
  public readonly skillTrees = inject(SkillTreesService)
  public readonly transmogs = inject(TransmogsService)

  public async export(): Promise<ExportedDB> {
    if (this.db instanceof AppDbDexie) {
      return exportDB(this.db.dexie)
    }
    throw new Error('export is only supported for Dexie database')
  }

  public async import(data: ExportedDB) {
    if (!(this.db instanceof AppDbDexie)) {
      throw new Error('import is only supported for Dexie database')
    }
    await importDB(this.db.dexie, data)
  }

  public async clearAllData() {
    await this.db.dropTables()
  }

  public async clearUserData(userId: string) {
    if (!userId || userId === 'local') {
      throw new Error('clearing local user data is not allowed')
    }
    if (this.db instanceof AppDbDexie) {
      await this.db.clearUserData(userId)
    }
  }

  public async syncUserData() {
    this.characters.sync()
    this.bookmarks.sync()
    this.gearsets.sync()
    this.items.sync()
    this.presets.sync()
    this.skillTrees.sync()
    this.transmogs.sync()
  }

  public async takeoverUserData(targetUserId: string) {
    if (!targetUserId || targetUserId === 'local') {
      // nothing to do
      return
    }
    if (this.db instanceof AppDbDexie) {
      await this.db.transferOwnershipOfData({
        sourceUserId: 'local',
        targetUserid: targetUserId,
      })
    }
  }

  public afterSignedIn(userId: string) {
    // TODO: check
  }

  public afterSignedOut(userId: string) {
    this.clearUserData(userId)
  }

  public userDataStats(userId: string) {
    return combineLatest({
      bookmarks: this.bookmarks.observeCount(userId),
      characters: this.characters.observeCount(userId),
      gearsets: this.gearsets.observeCount(userId),
      items: this.items.observeCount(userId),
      presets: this.presets.observeCount(userId),
      skillTrees: this.skillTrees.observeCount(userId),
      transmogs: this.transmogs.observeCount(userId),
    })
  }
}

async function exportDB(db: Dexie) {
  if (!db.isOpen()) {
    await db.open()
  }
  return await db.transaction('r', db.tables, async () => {
    return {
      name: db.name,
      tables: await Promise.all(db.tables.map(exportTable)),
    }
  })
}

async function exportTable(table: Table): Promise<ExportedTable> {
  return {
    name: table.name,
    rows: await table.toArray(),
  }
}

async function importDB(db: Dexie, data: ExportedDB) {
  if (!data || data.name !== db.name) {
    return
  }
  if (!data.tables || !Array.isArray(data.tables) || !data.tables.length) {
    return
  }
  if (!db.isOpen()) {
    await db.open()
  }
  return db.transaction('rw', db.tables, async () => {
    for (const table of data.tables) {
      await importTable(db, table)
    }
  })
}

async function importTable(db: Dexie, data: ExportedTable) {
  if (!data || !Array.isArray(data.rows) || !data.rows.length) {
    return
  }
  if (!db.tables.some((it) => it.name === data.name)) {
    return
  }
  const table = db.table(data.name)
  await table.clear()
  table.bulkAdd(data.rows)
}
