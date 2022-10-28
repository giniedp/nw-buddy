import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NwDataloader } from '@nw-data/datatables'
import { environment } from 'apps/web/environments/environment'
import { Observable, shareReplay } from 'rxjs'

export type LocaleData = Record<string, { value: string }>


@Injectable({ providedIn: 'root' })
export class NwDataService extends NwDataloader {
  private cache = new Map<string, Observable<any>>()

  public get apiMethods(): Array<keyof NwDataloader> {
    return Object.getOwnPropertyNames(NwDataloader.prototype) as Array<keyof NwDataloader>
  }

  public storagePath: string = environment.nwDataUrl.replace(/\/+$/, '')

  public constructor(private http: HttpClient) {
    super()
  }

  public load<T>(path: string): Observable<T> {
    if (!this.cache.has(path)) {
      const url = `${this.storagePath}/datatables/${path}`.toLocaleLowerCase()
      const src$ = this.http.get(url).pipe(shareReplay(1))
      this.cache.set(path, src$)
    }
    return this.cache.get(path)
  }

  public loadTranslations(locale: string) {
    const url = `${this.storagePath}/localization/${locale}.json`.toLocaleLowerCase()
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
