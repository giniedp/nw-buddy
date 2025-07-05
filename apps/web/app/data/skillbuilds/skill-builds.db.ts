import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_SKILL_BUILDS } from './constants'
import { SkillTreeRecord } from './types'

@Injectable({ providedIn: 'root' })
export class SkillBuildsDB extends DBTable<SkillTreeRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<SkillTreeRecord>(DBT_SKILL_BUILDS)
  public get events() {
    return this.table.events
  }
}
