import { Inject, Injectable } from '@angular/core'
import { Dexie } from 'dexie'
import { APP_DB } from './db'
import { DBTable } from './db-table'
import { filter, map, of } from 'rxjs'
import { DomSanitizer } from '@angular/platform-browser'

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

  public imageUrl(id: string) {
    if (!id) {
      return of(null)
    }
    return this.live((it) => it.get(id).catch(() => null as ImageRecord))
      .pipe(map((it) => it?.data instanceof ArrayBuffer ? it : null))
      .pipe(
        map((it) => {
          if (!it) {
            return null
          }
          const blob = new Blob([it.data], { type: it.type })
          const urlCreator = window.URL || window.webkitURL
          const url = urlCreator.createObjectURL(blob)
          return this.sanitizer.bypassSecurityTrustUrl(url)
        })
      )
  }

  public constructor(@Inject(APP_DB) db: Dexie, private sanitizer: DomSanitizer) {
    super(db, DBT_IMAGES)
  }
}
