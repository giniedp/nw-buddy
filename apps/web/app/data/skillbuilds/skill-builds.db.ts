import { Injectable } from '@angular/core'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_SKILL_BUILDS } from './constants'
import { SkillSetRecord } from './types'

@Injectable({ providedIn: 'root' })
export class SkillBuildsDB extends DBTable<SkillSetRecord> {
  public readonly db = injectAppDB()
  public readonly table = this.db.table<SkillSetRecord>(DBT_SKILL_BUILDS)
}
