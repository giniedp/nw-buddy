import { Injectable } from '@angular/core'
import { from, switchMap } from 'rxjs'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_CHARACTERS } from './constants'
import { CharacterRecord } from './types'

@Injectable({ providedIn: 'root' })
export class CharactersDB extends DBTable<CharacterRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<CharacterRecord>(DBT_CHARACTERS)

  public async getCurrent() {
    return this.db.transaction('rw', this.table, async () => {
      if ((await this.table.count()) == 0) {
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
