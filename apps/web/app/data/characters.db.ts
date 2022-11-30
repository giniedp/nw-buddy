import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { from, switchMap } from 'rxjs'
import { APP_DB } from './db'
import { DBTable } from './db-table'

export interface CharacterRecord {
  /**
   * ID in database
   */
  id: string
  /**
   * Name of the character
   */
  name: string
  /**
   * Character level
   */
  level: number
  /**
   * Character weapon levels
   */
  weaponLevels: Record<string, number>
  /**
   * Character tradeskill levels
   */
  tradeskillLevels: Record<string, number>
  /**
   * Character tradeskill armor sets
   */
  tradeskillSets: Record<string, string[]>
  /**
   * Crafting preference: first light bonus
   */
  craftingFlBonus: boolean
}

export const DBT_CHARACTERS = 'characters'
@Injectable({ providedIn: 'root' })
export class CharactersDB extends DBTable<CharacterRecord> {
  public static readonly tableName = DBT_CHARACTERS
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_CHARACTERS)
  }

  public async getCurrent() {
    return this.db.transaction('rw', this.table, async () => {
      if (await this.table.count() == 0) {
        return this.create({})
      }
      const keys = await this.table.toCollection().keys()
      const result = await this.read(keys[0] as string)
      return result
    })
  }

  public observeCurrent() {
    return from(this.getCurrent()).pipe(switchMap((it) => this.live((t) => t.get(it.id))))
  }
}
