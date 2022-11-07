import { inject, Injectable, InjectionToken } from '@angular/core'
import { Dexie } from 'dexie'
import { DBT_GEARSETS } from './gearsets.db'
import { DBT_ITEMS } from './item-instances.db'

export const APP_DB_NAME = new InjectionToken<string>('APP_DB_NAME', {
  factory: () => 'nw-buddy'
})

export const APP_DB = new InjectionToken<Dexie>('APP_DB', {
  providedIn: 'root',
  factory: () => {
    const db = new Dexie(inject(APP_DB_NAME))
    initDb(db)
    return db
  }
})

function initDb(db: Dexie) {
  db.version(1).stores({
    [DBT_ITEMS]: 'id,itemId,gearScore',
    [DBT_GEARSETS]: 'id,*tags',
  })
}
