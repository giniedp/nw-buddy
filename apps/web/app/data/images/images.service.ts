import { inject, Injectable } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { isObservable, map, Observable, of, switchMap } from 'rxjs'
import { injectImagesDB } from './images.db'
import { ImageRecord } from './types'

@Injectable({ providedIn: 'root' })
export class ImagesService {
  private imagesDB = injectImagesDB()
  private sanitizer = inject(DomSanitizer)

  public read(id: string) {
    return this.imagesDB.read(id)
  }

  public observeById(id: string) {
    return this.imagesDB.observeById(id)
  }

  public observeAll() {
    return this.imagesDB.observeAll()
  }

  public async create(record: Partial<ImageRecord>) {
    return this.imagesDB.create(record)
  }

  public async update(id: string, record: Partial<ImageRecord>) {
    return this.imagesDB.update(id, record)
  }

  public async delete(id: string) {
    return this.imagesDB.destroy(id)
  }

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
          const url = URL.createObjectURL(blob)
          return this.sanitizer.bypassSecurityTrustUrl(url)
        }),
      )
  }
}
