import {
  HttpClient
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NwDataLoader } from '@nw-data/datatables'
import { Observable, shareReplay } from 'rxjs'

export type LocaleData = Record<string, { value: string }>

@Injectable({ providedIn: 'root' })
export class NwDataService extends NwDataLoader {
  private cache = new Map<string, Observable<any>>()

  public get apiMethods(): Array<keyof NwDataLoader> {
    return Object.getOwnPropertyNames(NwDataLoader.prototype) as Array<keyof NwDataLoader>
  }

  public constructor(private http: HttpClient) {
    super()
  }

  public load<T>(path: string): Observable<T> {
    if (!this.cache.has(path)) {
      const url = `datatables/${path}`.toLocaleLowerCase()
      const src$ = this.http.get(url).pipe(shareReplay(1))
      this.cache.set(path, src$)
    }
    return this.cache.get(path)
  }

  public loadTranslations(locale: string) {
    const url = `localization/${locale}.json`.toLocaleLowerCase()
    return this.http.get<Record<string, string>>(url)
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
