import { inject, Injectable } from '@angular/core'
import Dexie, { Table } from 'dexie'
import { combineLatest, filter, switchMap } from 'rxjs'
import { ConfirmDialogComponent, ModalService } from '~/ui/layout'
import { AppDbRecord } from './app-db'
import { AppDbDexie } from './app-db.dexie'
import { BookmarksService } from './bookmarks'
import { CharactersService, CharacterStore } from './characters'
import { injectAppDB } from './db'
import { GearsetsService } from './gearsets'
import { ItemsService } from './items'
import { SkillTreesService } from './skill-tree'
import { TablePresetsService } from './table-presets'
import { TransmogsService } from './transmogs'
import { LOCAL_USER_ID } from './constants'

export type ExportedDB = { name: string; tables: ExportedTable[] }
export type ExportedTable<T extends AppDbRecord = AppDbRecord> = { name: string; rows: T[] }

@Injectable({ providedIn: 'root' })
export class DbService {
  public readonly db = injectAppDB()
  public readonly character = inject(CharacterStore)
  public readonly characters = inject(CharactersService)
  public readonly bookmarks = inject(BookmarksService)
  public readonly gearsets = inject(GearsetsService)
  public readonly items = inject(ItemsService)
  public readonly presets = inject(TablePresetsService)
  public readonly skillTrees = inject(SkillTreesService)
  public readonly transmogs = inject(TransmogsService)

  private modal = inject(ModalService)
  private allStores = [
    this.characters,
    this.bookmarks,
    this.gearsets,
    this.items,
    this.presets,
    this.skillTrees,
    this.transmogs,
  ]

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
    // switch to default character, forces a reload of all character listeners
    this.character.load()
  }

  public async clearAllData() {
    await this.db.dropTables()
  }

  public async clearUserData(userId: string) {
    if (!userId || userId === LOCAL_USER_ID) {
      throw new Error('clearing local user data is not allowed')
    }
    if (this.db instanceof AppDbDexie) {
      await this.db.clearUserData(userId)
    }
    // // switch to default character, forces a reload of all character listeners
    // this.characters.load()
    // this.characters.sync()
  }

  public async deleteAccountData(userId: string) {
    if (!userId || userId === LOCAL_USER_ID) {
      throw new Error('clearing local user data is not allowed')
    }
    for (const store of this.allStores) {
      await store.deleteUserData(userId)
    }
    // switch to default character, forces a reload of all character listeners
    this.characters.sync()
    this.character.load()
  }

  public async importToAccount(targetUserId: string) {
    if (!targetUserId || targetUserId === LOCAL_USER_ID) {
      // nothing to do
      return
    }

    // we currently support only one progression character per user
    // merge local character into target user character
    const localChar = (await this.characters.table.where({ userId: LOCAL_USER_ID }))?.[0]
    const targetChar = (await this.characters.table.where({ userId: targetUserId }))?.[0]
    if (!targetChar) {
      throw new Error(`Target user ${targetUserId} does not have a character`)
    }
    if (localChar) {
      await this.characters.update(targetChar.id, {
        ...targetChar,
        ...localChar,
        id: targetChar.id,
        userId: targetUserId,
        progressionLevels: {
          ...(targetChar.progressionLevels || {}),
          ...(localChar.progressionLevels || {}),
        },
        effectStacks: {
          ...(targetChar.effectStacks || {}),
          ...(localChar.effectStacks || {}),
        },
      })
    }

    // markers are scoped by character
    const localBookmarks = await this.bookmarks.table.where({ userId: LOCAL_USER_ID })
    await this.bookmarks.import(targetChar.id, localBookmarks)

    const localGearsets = await this.gearsets.table.where({ userId: LOCAL_USER_ID })
    for (const record of localGearsets) {
      await this.gearsets.dublicate(record)
    }

    const localItems = await this.items.table.where({ userId: LOCAL_USER_ID })
    for (const record of localItems) {
      await this.items.dublicate(record)
    }

    const localSkills = await this.skillTrees.table.where({ userId: LOCAL_USER_ID })
    for (const record of localSkills) {
      await this.skillTrees.dublicate(record)
    }

    const localMogs = await this.transmogs.table.where({ userId: LOCAL_USER_ID })
    for (const record of localMogs) {
      await this.transmogs.dublicate(record)
    }

    const localPresets = await this.presets.table.where({ userId: LOCAL_USER_ID })
    for (const record of localPresets) {
      await this.presets.dublicate(record)
    }
  }

  public async syncUserData() {
    for (const store of this.allStores) {
      store.sync()
    }
  }

  public async afterSignedIn(userId: string) {
    // wait a while to ensure the user has some synced data
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const isNewUser = await this.detectNewUser(userId)
    if (!isNewUser) {
      return
    }
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Welcome to NW Buddy',
        body: 'It looks like you are a new user. Do you want to import your local data to your account?',
        negative: 'No, thanks',
        positive: 'Import',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap(() => this.importToAccount(userId)),
      )
      .subscribe({
        next: () => {
          this.modal.showToast({
            message: 'Data import complete',
            duration: 3000,
            color: 'success',
          })
        },
        error: () => {
          this.modal.showToast({
            message: 'Import failed',
            duration: 3000,
            color: 'danger',
          })
        },
      })
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

  private async detectNewUser(userId: string): Promise<boolean> {
    for (const store of this.allStores) {
      if (store === this.characters) {
        continue
      }
      const count = await store.table.countWhere({ userId })
      if (count > 0) {
        return false
      }
    }
    const character = (await this.characters.table.where({ userId }))[0]
    if (character) {
      const ageInMs = new Date().getTime() - new Date(character.createdAt).getTime()
      const ageInSec = Math.floor(ageInMs / 1000)
      if (ageInSec > 60) {
        // user has data older than 1 minute, assume this is not a new user
        return false
      }
    }
    // no data found, assume this is a new user
    return true
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
