import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { AttributeRef } from '~/nw/attributes'

import { APP_DB } from './db'
import { DBTable } from './db-table'
import { ItemInstance } from './item-instances.db'
import { SkillBuild } from './skill-builds.db'

export type GearsetCreateMode = 'link' | 'copy'
export interface GearsetRecord {
  /**
   * ID in database
   */
  id: string
  /**
   * Name of the gearset
   */
  name: string
  /**
   * The mode how new items should be stored in this set
   */
  createMode?: GearsetCreateMode
  /**
   * User defined tags
   */
  tags?: string[]
  /**
   * Item slots for this gear
   */
  slots?: Record<string, string | ItemInstance>
  /**
   * Assigned attribute points
   */
  attrs?: Record<AttributeRef, number>
  /**
   * Weapon skill builds
   */
  skills?: Record<string, string | SkillBuild>
  /**
   * Profile image id
   */
  imageId?: string
}

export const DBT_GEARSETS = 'gearsets'
@Injectable({ providedIn: 'root' })
export class GearsetsDB extends DBTable<GearsetRecord> {
  public static readonly tableName = DBT_GEARSETS
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_GEARSETS)
  }
}
