import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_SKILL_TREES } from './constants'
import { SkillTreeRecord } from './types'

@Injectable({ providedIn: 'root' })
export class SkillTreesDB extends DBTable<SkillTreeRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<SkillTreeRecord>(DBT_SKILL_TREES)
  public get events() {
    return this.table.events
  }
}
