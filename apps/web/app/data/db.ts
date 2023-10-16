import { inject, InjectionToken } from '@angular/core'
import { Dexie } from 'dexie'
import { DBT_CHARACTERS } from './characters.db'
import { DBT_GEARSETS } from './gearsets.db'
import { DBT_IMAGES } from './images.db'
import { DBT_ITEMS } from './item-instances.db'
import { DBT_SKILL_BUILDS } from './skill-builds.db'
import { DBT_TABLE_PRESETS, DBT_TABLE_STATES } from './table-preset.db'

export const APP_DB_NAME = new InjectionToken<string>('APP_DB_NAME', {
  factory: () => 'nw-buddy',
})

export const APP_DB = new InjectionToken<Dexie>('APP_DB', {
  providedIn: 'root',
  factory: () => {
    const db = new Dexie(inject(APP_DB_NAME))
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
