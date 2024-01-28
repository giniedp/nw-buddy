import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { NwDataLoader } from '@nw-data/generated'
import { Observable, of, shareReplay, switchMap } from 'rxjs'

export type LocaleData = Record<string, { value: string }>

@Injectable({ providedIn: 'root' })
export class NwDataLoaderService extends NwDataLoader {
  private http = inject(HttpClient)
  private cache = new Map<string, Observable<any>>()

  public load<T>(path: string): Observable<T>
  public load<T>(path: string, responseType: 'json'): Observable<T>
  public load(path: string, responseType: 'arrayBuffer'): Observable<ArrayBuffer>
  public load(path: string, responseType: 'blob'): Observable<Blob>
  public load(path: string, responseType: any = 'json'): Observable<unknown> {
    if (!this.cache.has(path)) {
      const url = `datatables/${path}`.toLocaleLowerCase()
      const src$ = this.http
        .request('GET', url, {
          responseType: responseType === 'json' ? 'json' : 'blob',
        })
        .pipe(
          switchMap((res) => {
            if (responseType === 'arrayBuffer' && res instanceof Blob) {
              return res.arrayBuffer()
            }
            return of(res)
          }),
          shareReplay(1),
        )
      this.cache.set(path, src$)
    }
    return this.cache.get(path)
  }

  public loadTranslations(locale: string) {
    const url = `localization/${locale}.json`.toLocaleLowerCase()
    return this.http.get<Record<string, string>>(url)
  }
}
