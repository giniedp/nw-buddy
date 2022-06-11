import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NwDataloader } from '@nw-data/datatables'
import { Observable, shareReplay } from 'rxjs'
import { TranslateSource } from '../i18n/translate-source'

export type LocaleData = Record<string, { value: string }>

@Injectable({ providedIn: 'root' })
export class NwDataService extends NwDataloader implements TranslateSource {
  private cache = new Map<string, Observable<any>>()

  public constructor(private http: HttpClient) {
    super()
  }

  public load<T>(path: string) {
    if (!this.cache.has(path)) {
      const src$ = this.http.get<T>('./nw-data/datatables/' + path.toLocaleLowerCase())
      this.cache.set(path, src$.pipe(shareReplay(1)))
    }
    return this.cache.get(path)
  }

  public loadTranslations(locale: string) {
    return this.http.get<Record<string, string>>(`./nw-data/localization/${locale.toLowerCase()}.json`)
  }
}
