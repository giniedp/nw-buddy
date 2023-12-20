import {
  HttpClient
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NwDataLoader } from '@nw-data/generated'
import { Observable, map, of, shareReplay, switchMap, tap } from 'rxjs'

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

  public load<T>(path: string): Observable<T>
  public load<T>(path: string, responseType: 'json'): Observable<T>
  public load(path: string, responseType: 'arrayBuffer'): Observable<ArrayBuffer>
  public load(path: string, responseType: 'blob'): Observable<Blob>
  public load(path: string, responseType: any = 'json'): Observable<unknown> {
    if (!this.cache.has(path)) {
      const url = `datatables/${path}`.toLocaleLowerCase()
      const src$ = this.http.request('GET', url, {
        responseType: responseType === 'json' ? 'json' : 'blob',
      }).pipe(
        switchMap((res) => {
          if (responseType === 'arrayBuffer' && res instanceof Blob) {
            return res.arrayBuffer()
          }
          return of(res)
        }),
        shareReplay(1)
      )
      this.cache.set(path, src$)
    }
    return this.cache.get(path)
  }

  public loadTranslations(locale: string) {
    const url = `localization/${locale}.json`.toLocaleLowerCase()
    return this.http.get<Record<string, string>>(url)
  }

  public matchingApiMethods<T extends keyof NwDataService>(match: (method: string) => boolean) {
    return this.apiMethods
      .filter(match)
      .map((name) => name as T)
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
