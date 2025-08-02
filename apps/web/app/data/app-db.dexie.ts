import { Dexie, Transaction } from 'dexie'
import { AppDb, AppDbRecord, createId } from './app-db'
import { AppDbDexieTable } from './app-db.dexie-table'
import { BookmarkRecord } from './bookmarks/types'
import { GAME_MODE_TO_PROGRESSION_ID } from './characters/constants'
import { CharacterRecord, TerritoryData } from './characters/types'
import {
  DBT_BOOKMARKS,
  DBT_CHARACTERS,
  DBT_GEARSETS,
  DBT_ITEMS,
  DBT_SKILL_TREES,
  DBT_TABLE_PRESETS,
  DBT_TABLE_STATES,
  DBT_TRANSMOGS,
  LOCAL_USER_ID,
} from './constants'

const ALL_TABLE_NAMES = [
  DBT_CHARACTERS,
  DBT_BOOKMARKS,
  DBT_GEARSETS,
  DBT_ITEMS,
  DBT_SKILL_TREES,
  DBT_TABLE_PRESETS,
  DBT_TABLE_STATES,
  DBT_TRANSMOGS,
]

export class AppDbDexie extends AppDb {
  private tables: Record<string, AppDbDexieTable<any>> = {}
  public readonly dexie: Dexie
  public constructor(name: string) {
    super()
    this.dexie = new Dexie(name)
    this.createSchema(this.dexie)
  }

  public override table(name: string) {
    this.tables[name] = this.tables[name] || new AppDbDexieTable(this, name)
    return this.tables[name]
  }

  public async dropTables() {
    for (const table of Object.values(this.tables)) {
      await this.dexie.table(table.tableName).clear()
    }
  }

  public async clearUserData(userId: string) {
    await this.dexie.open()
    for (const table of ALL_TABLE_NAMES) {
      await this.dexie.table(table).where({ userId }).delete()
    }
  }

  public async copytUserData({ sourceUserId, targetUserid }: { sourceUserId: string; targetUserid: string }) {
    await this.dexie.open()

    for (const table of ALL_TABLE_NAMES) {
      await this.dexie
        .table(table)
        .where({ userId: sourceUserId })
        .modify((item) => {
          item.userId = targetUserid
        })
    }
  }

  private createSchema(db: Dexie) {
    db.version(1).stores({
      items: 'id,itemId,gearScore',
      gearsets: 'id,*tags',
    })
    db.version(2).stores({
      images: 'id',
    })
    db.version(3).stores({
      characters: 'id',
    })
    db.version(4).stores({
      skillbuilds: 'id',
    })
    db.version(5).stores({
      ['table-presets']: 'id,key',
      ['table-states']: 'id',
    })

    db.version(6)
      .stores({
        items: 'id,itemId,gearScore,userId',
        gearsets: 'id,*tags,userId,characterId',
        images: null, // deleted
        characters: 'id,userId',
        skillbuilds: 'id,userId',
        'table-presets': 'id,key,userId',
        'table-states': 'id,userId',
        transmogs: 'id,userId',
        bookmarks: 'id,userId,[userId+characterId]',
      })
      .upgrade(async (tx) => {
        await fillMissingDefaults(tx)
        await ensureCharacter(tx)
        await migrateBookmarks(tx)
      })

    db.version(7).upgrade(async (tx) => migrateProgression(tx))
  }
}

async function fillMissingDefaults(tx: Transaction) {
  for (const table of ALL_TABLE_NAMES) {
    await tx
      .table(table)
      .toCollection()
      .modify((item: AppDbRecord) => {
        item.userId ||= LOCAL_USER_ID
        item.syncState ||= 'pending'
      })
  }
}

async function ensureCharacter(tx: Transaction) {
  const table = tx.table(DBT_CHARACTERS)
  const count = await table.count()
  if (count > 0) {
    return
  }
  const character: CharacterRecord = {
    id: createId(),
    name: null,
    userId: LOCAL_USER_ID,
    progressionLevels: {},
    effectStacks: {},
    territories: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await table.add(character, character.id)
}

async function migrateBookmarks(tx: Transaction) {
  const character = await tx.table(DBT_CHARACTERS).toCollection().first()
  const bookmarks = extractLegacyBookmarks()
  const table = tx.table(DBT_BOOKMARKS)
  for (const bookmark of bookmarks) {
    bookmark.id = createId()
    bookmark.characterId = character.id
    bookmark.userId = LOCAL_USER_ID
    await table.add(bookmark, bookmark.id).catch(console.error)
  }
}

function extractLegacyBookmarks() {
  const result: BookmarkRecord[] = []
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('nwb:items:')) {
      continue
    }
    try {
      const itemId = key.replace('nwb:items:', '').toLowerCase()
      const value = JSON.parse(localStorage.getItem(key)) as { gs: number; mark: number }
      if (!value.gs && !value.mark) {
        continue
      }
      result.push({
        id: null,
        characterId: null,
        userId: null,
        itemId,
        gearScore: value.gs || 0,
        flags: value.mark || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      delete value.gs
      delete value.mark
      if (Object.keys(value).length === 0) {
        toRemove.push(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (e) {
      console.error(`Failed to parse bookmark from localStorage key "${key}":`, e)
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key)
  }
  return result
}

async function migrateProgression(tx: Transaction) {
  const { dungeonProgressions, territoryProgressions } = extractLegacyProgression()
  const character: CharacterRecord = await tx.table(DBT_CHARACTERS).toCollection().first()
  if (!character) {
    return
  }
  for (const { progressionId, difficulty, level } of dungeonProgressions) {
    const key = `${progressionId}:${difficulty}`
    character.progressionLevels ||= {}
    character.progressionLevels[key] = level
  }
  for (const { progressionId, data } of territoryProgressions) {
    character.territories ||= {}
    character.territories[progressionId] = data
  }
  tx.table(DBT_CHARACTERS).update(character.id, character)
}

function extractLegacyProgression() {
  const toRemove: string[] = []
  const MEDAL_MAP = {
    bronze: 1,
    silver: 2,
    gold: 3,
  } as const
  const dungeonProgressions: Array<{ progressionId: string; difficulty: number; level: number }> = []
  const territoryProgressions: Array<{ progressionId: string; data: TerritoryData }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('nwb:')) {
      continue
    }
    if (key.startsWith('nwb:dungeons:')) {
      toRemove.push(key)
      const dungeonId = key.replace('nwb:dungeons:', '')
      const progressionId = GAME_MODE_TO_PROGRESSION_ID[dungeonId]
      if (!progressionId) {
        continue
      }
      const value = JSON.parse(localStorage.getItem(key)) as any as {
        ranks: Record<number, 'gold' | 'silver' | 'bronze'>
      }
      const ranks = value?.ranks
      if (!ranks) {
        continue
      }
      for (const [difficulty, medal] of Object.entries(ranks)) {
        if (Number(difficulty) > 3) {
          continue
        }
        const level = MEDAL_MAP[medal]
        if (level) {
          dungeonProgressions.push({
            progressionId,
            difficulty: Number(difficulty),
            level,
          })
        }
      }
    }
    if (key === 'nwb:territories') {
      toRemove.push(key)
      const value = JSON.parse(localStorage.getItem(key)) as Record<number, TerritoryData>
      for (const [territoryId, territory] of Object.entries(value)) {
        if (territory.standing) {
          territoryProgressions.push({ progressionId: territoryId, data: territory })
        }
      }
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key)
  }
  return {
    dungeonProgressions,
    territoryProgressions,
  }
}
