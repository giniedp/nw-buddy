import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { AttributeRef } from '~/nw/attributes'
import { APP_DB } from './db'
import { DBTable } from './db-table'

export interface SkillBuild {
  /**
   * The weapon tag
   */
  weapon: string
  /**
   *
   */
  tree1: string[]
  /**
   *
   */
  tree2: string[]
}

export interface SkillBuildRecord extends SkillBuild {
  /**
   * ID in database
   */
  id: string
  /**
   * Name of the gearset
   */
  name: string
  /**
   * The ipns private key
   */
  ipnsKey?: string
  /**
   * The ipns public name
   */
  ipnsName?: string
  /**
   * Assigned attribute points
   */
  attrs?: Record<AttributeRef, number>
}

export const DBT_SKILL_BUILDS = 'skillbuilds'
@Injectable({ providedIn: 'root' })
export class SkillBuildsDB extends DBTable<SkillBuildRecord> {
  public static readonly tableName = DBT_SKILL_BUILDS
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_SKILL_BUILDS)
  }
}
