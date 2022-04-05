import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NwDataloader } from '@nw-data/datatables'
import { combineLatest, map } from 'rxjs'
import { TranslateSource } from '../i18n/translate-source'

export type LocaleData = Record<string, { value: string }>

@Injectable({ providedIn: 'root' })
export class NwDataService extends NwDataloader implements TranslateSource {
  public constructor(private http: HttpClient) {
    super()
  }

  public load<T>(path: string) {
    return this.http.get<T>('./nw-data/' + path.toLocaleLowerCase())
  }

  public loadTranslations(locale: string) {
    const sources = NwDataService.localeFiles
      .map((source) => `localization/${locale}/${source}`)
      .map((it) => this.load<LocaleData>(it))
    return combineLatest(sources).pipe(
      map((data) => {
        const result: Record<string, string> = {}
        for (const record of data) {
          for (const key in record) {
            result[key] = record[key].value
          }
        }
        return result
      })
    )
  }

  public iconPath(path: string) {
    if (!path) {
      return ''
    }
    return path
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/^\/?lyshineui\/images/, '/nw-data')
      .replace(/\.png$/, '.webp')
  }

  public getLocaleKey(key: string) {
    if (key && key.startsWith('@')) {
      return key.substring(1)
    }
    return key
  }
}
