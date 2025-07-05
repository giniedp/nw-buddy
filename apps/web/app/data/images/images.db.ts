import { Injectable, inject } from '@angular/core'

import { DomSanitizer } from '@angular/platform-browser'
import { Observable, isObservable, map, of, switchMap } from 'rxjs'
import { injectAppDB } from '../db'
import { DBTable } from '../db-table'
import { DBT_IMAGES } from './constants'
import { ImageRecord } from './types'
import { injectWindow } from '~/utils/injection/window'

@Injectable({ providedIn: 'root' })
export class ImagesDB extends DBTable<ImageRecord> {
  private window = injectWindow()
  public readonly db = injectAppDB()
  public readonly table = this.db.table<ImageRecord>(DBT_IMAGES)
  public get events() {
    return this.table.events
  }

  private sanitizer = inject(DomSanitizer)
  public imageUrl(id: string | Observable<string>) {
    if (!isObservable(id)) {
      id = of(id)
    }
    return id
      .pipe(switchMap((id) => this.observeById(id)))
      .pipe(map((it) => (it?.data instanceof ArrayBuffer ? it : null)))
      .pipe(
        map((it) => {
          if (!it) {
            return null
          }
          const blob = new Blob([it.data], { type: it.type })
          const urlCreator = this.window.URL || this.window.webkitURL
          const url = urlCreator.createObjectURL(blob)
          return this.sanitizer.bypassSecurityTrustUrl(url)
        }),
      )
  }
}
