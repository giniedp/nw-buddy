import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { APP_DB } from './db'
import { DBTable } from './db-table'

export interface ImageRecord {
  /**
   * Image ID
   */
  id: string
  /**
   * Mime Type
   */
  type: string
  /**
   * Image Data
   */
  data: ArrayBuffer
}

export const DBT_IMAGES = 'images'
@Injectable({ providedIn: 'root' })
export class ImagesDB extends DBTable<ImageRecord> {
  public static readonly tableName = DBT_IMAGES
  public constructor(@Inject(APP_DB) db: Dexie) {
    super(db, DBT_IMAGES)
  }
}
