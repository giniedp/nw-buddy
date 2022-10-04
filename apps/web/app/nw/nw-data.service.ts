import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NwDataloader } from '@nw-data/datatables'
import { APP_CONFIG } from 'apps/web/environments/environment'
import { map, Observable, shareReplay, tap } from 'rxjs'
import { parse } from 'papaparse'
export type LocaleData = Record<string, { value: string }>

const NW_DIR = `./nw-data/${APP_CONFIG.isPTR ? 'ptr' : 'live'}/`

@Injectable({ providedIn: 'root' })
export class NwDataService extends NwDataloader {
  private cache = new Map<string, Observable<any>>()

  public get apiMethods(): Array<keyof NwDataloader> {
    return Object.getOwnPropertyNames(NwDataloader.prototype) as Array<keyof NwDataloader>
  }

  public constructor(private http: HttpClient) {
    super()
  }

  public load<T>(path: string): Observable<T> {
    if (!this.cache.has(path)) {
      const url = NW_DIR + 'datatables/' + path.toLocaleLowerCase()
      const src$ = this.http.get(url).pipe(shareReplay(1))
      this.cache.set(path, src$)
    }
    return this.cache.get(path)
  }

  public loadTranslations(locale: string) {
    return this.http.get<Record<string, string>>(NW_DIR + `localization/${locale.toLowerCase()}.json`)
  }

  public apiMethodsByPrefix<T extends keyof NwDataService>(prefix: string, asKey: T) {
    return this.apiMethods
      .filter((it) => it.startsWith(prefix))
      .map((name) => {
        return {
          name: name as T,
          prefix: prefix,
          suffix: name.replace(prefix, ''),
        }
      })
  }
}
