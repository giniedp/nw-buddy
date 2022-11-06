import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { APP_DB } from './db'
import { DBTable } from './db-table'
import { ItemInstance } from './item-instances.db'

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
}

export const DBT_GEARSETS = 'player-gearsets'
@Injectable({ providedIn: 'root' })
export class GearsetsDB extends DBTable<GearsetRecord> {
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_GEARSETS)
  }
}
