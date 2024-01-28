import { inject, InjectionToken } from '@angular/core'
import { Dexie } from 'dexie'
import {
  DBT_CHARACTERS,
  DBT_GEARSETS,
  DBT_IMAGES,
  DBT_ITEMS,
  DBT_SKILL_BUILDS,
  DBT_TABLE_PRESETS,
  DBT_TABLE_STATES,
} from './constants'

export function injectAppDBName() {
  return inject(APP_DB_NAME)
}

export function injectAppDB() {
  return inject(APP_DB)
}

export const APP_DB_NAME = new InjectionToken<string>('APP_DB_NAME', {
  factory: () => 'nw-buddy',
})

export const APP_DB = new InjectionToken<Dexie>('APP_DB', {
  providedIn: 'root',
  factory: () => {
    const db = new Dexie(injectAppDBName())
    initDb(db)
    return db
  },
})

function initDb(db: Dexie) {
  db.version(1).stores({
    [DBT_ITEMS]: 'id,itemId,gearScore',
    [DBT_GEARSETS]: 'id,*tags',
  })
  db.version(2).stores({
    [DBT_IMAGES]: 'id',
  })
  db.version(3).stores({
    [DBT_CHARACTERS]: 'id',
  })
  db.version(4).stores({
    [DBT_SKILL_BUILDS]: 'id',
  })
  db.version(5).stores({
    [DBT_TABLE_PRESETS]: 'id,key',
    [DBT_TABLE_STATES]: 'id',
  })
}
