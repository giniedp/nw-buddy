import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { APP_DB } from './db'
import { DBTable } from './db-table'

export interface ItemInstance {
  /**
   * New world item id
   */
  itemId: string
  /**
   * Gear score of this item
   */
  gearScore: number
  /**
   * Rolled perks on the item
   */
  perks: Record<string, string>
}

export interface ItemInstanceRecord extends ItemInstance {
  /**
   * Record id in the database
   */
  id: string
  /**
   * Whether item is locked. Must be unlocked before edit or delete
   */
  locked?: boolean
}

export const DBT_ITEMS = 'player-items'
@Injectable({ providedIn: 'root' })
export class ItemInstancesDB extends DBTable<ItemInstanceRecord> {
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_ITEMS)
  }
}
