import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, of, shareReplay, switchMap } from 'rxjs'

export type LocaleData = Record<string, { value: string }>

@Injectable({ providedIn: 'root' })
export class NwDataLoaderService {
  private http = inject(HttpClient)
  private cache = new Map<string, Observable<any>>()

  public load<T>(path: string): Observable<T>
  public load<T>(path: string, responseType: 'json'): Observable<T>
  public load(path: string, responseType: 'arrayBuffer'): Observable<ArrayBuffer>
  public load(path: string, responseType: 'blob'): Observable<Blob>
  public load(path: string, responseType: any = 'json'): Observable<unknown> {
    path = path.toLocaleLowerCase()
    if (!this.cache.has(path)) {
      const src$ = this.http
        .request('GET', path, {
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
    return this.load<Record<string, string>>(`localization/${locale}.json`)
  }
}
