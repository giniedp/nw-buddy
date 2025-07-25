import { createId } from './app-db'
import { BookmarkRecord } from './bookmarks'
import { recursivelyDecodeArrayBuffers } from './buffer-encoding'
import { CharacterRecord, TerritoryData } from './characters'
import { GAME_MODE_TO_PROGRESSION_ID } from './characters/constants'
import {
  DATABASE_NAME,
  DBT_BOOKMARKS,
  DBT_CHARACTERS,
  LOCAL_USER_ID,
  PREFERENCES_DB_KEY,
  PREFERENCES_PREFIX,
} from './constants'
import { ExportedDB } from './db.service'

export async function convertImportData(doc: Object) {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid import data')
  }

  await recursivelyDecodeArrayBuffers(doc)

  const database = parseDatabase(doc)
  const preferences = parsePreferences(doc)
  fillMissingDefaults(database)
  ensureCharacter(database)
  removeUnknownTables(database)
  migrateBookmarks(database, preferences)
  migrateProgression(database, preferences)
  return {
    database,
    preferences,
  }
}

function parsePreferences(doc: any): Record<string, any> {
  const preferences: Record<string, any> = {}
  for (const key in doc) {
    if (key.startsWith(PREFERENCES_PREFIX)) {
      preferences[key] = doc[key]
    }
  }
  return preferences
}

function parseDatabase(doc: any): ExportedDB {
  if (!doc[PREFERENCES_DB_KEY]) {
    return null
  }
  const db = doc[PREFERENCES_DB_KEY] as ExportedDB
  if (db.name !== DATABASE_NAME) {
    throw new Error(`Invalid database name: ${db.name}, expected: ${DATABASE_NAME}`)
  }
  if (!Array.isArray(db.tables)) {
    throw new Error('Invalid database tables format')
  }
  return db
}

function fillMissingDefaults(db: ExportedDB) {
  for (const table of db.tables) {
    for (const row of table.rows) {
      row.userId ||= LOCAL_USER_ID
      row.syncState ||= 'pending'
    }
  }
}

function removeUnknownTables(db: ExportedDB) {
  const imagesIndex = db.tables.findIndex((t) => t.name === 'images')
  if (imagesIndex >= 0) {
    db.tables.splice(imagesIndex, 1)
  }
}

function ensureCharacter(db: ExportedDB) {
  let table = db.tables.find((t) => t.name === DBT_CHARACTERS)
  if (!table) {
    table = {
      name: DBT_CHARACTERS,
      rows: [],
    }
    db.tables.push(table)
  }
  if (table.rows.length > 0) {
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
  table.rows.push(character)
}

function migrateBookmarks(db: ExportedDB, pref: Record<string, any>) {
  const character = db.tables.find((t) => t.name === DBT_CHARACTERS)?.rows[0]
  const bookmarks = extractLegacyBookmarks(pref)
  let table = db.tables.find((t) => t.name === DBT_BOOKMARKS)
  if (!table) {
    table = {
      name: DBT_BOOKMARKS,
      rows: [],
    }
    db.tables.push(table)
  }
  for (const bookmark of bookmarks) {
    bookmark.id = createId()
    bookmark.characterId = character.id
    bookmark.userId = LOCAL_USER_ID
    table.rows.push(bookmark)
  }
}

function extractLegacyBookmarks(pref: Record<string, any>) {
  const result: BookmarkRecord[] = []
  const toRemove: string[] = []
  for (const key in pref) {
    if (!key || !key.startsWith('nwb:items:')) {
      continue
    }
    try {
      const itemId = key.replace('nwb:items:', '').toLowerCase()
      const value = pref[key] as { gs: number; mark: number }
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
      }
    } catch (e) {
      console.error(`Failed to parse bookmark from localStorage key "${key}":`, e)
    }
  }
  for (const key of toRemove) {
    delete pref[key]
  }
  return result
}

function migrateProgression(db: ExportedDB, pref: Record<string, any>) {
  const character = db.tables.find((t) => t.name === DBT_CHARACTERS)?.rows[0] as CharacterRecord
  const { dungeonProgressions, territoryProgressions } = extractLegacyProgression(pref)
  for (const { progressionId, difficulty, level } of dungeonProgressions) {
    const key = `${progressionId}:${difficulty}`
    character.progressionLevels ||= {}
    character.progressionLevels[key] = level
  }
  for (const { progressionId, data } of territoryProgressions) {
    character.territories ||= {}
    character.territories[progressionId] = data
  }
}

function extractLegacyProgression(pref: Record<string, any>) {
  const toRemove: string[] = []
  const MEDAL_MAP = {
    bronze: 1,
    silver: 2,
    gold: 3,
  } as const
  const dungeonProgressions: Array<{ progressionId: string; difficulty: number; level: number }> = []
  const territoryProgressions: Array<{ progressionId: string; data: TerritoryData }> = []
  for (const key in pref) {
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
      const value = pref[key] as any as {
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
      const value = pref[key] as Record<number, TerritoryData>
      for (const [territoryId, territory] of Object.entries(value)) {
        if (territory.standing) {
          territoryProgressions.push({ progressionId: territoryId, data: territory })
        }
      }
    }
  }
  for (const key of toRemove) {
    delete pref[key]
  }
  return {
    dungeonProgressions,
    territoryProgressions,
  }
}
