import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_CHARACTERS } from './constants'
import { CharacterRecord } from './types'

@Injectable({ providedIn: 'root' })
export class CharactersDB extends DBTable<CharacterRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<CharacterRecord>(DBT_CHARACTERS)
  public get events() {
    return this.table.events
  }
}
