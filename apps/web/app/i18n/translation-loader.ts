import { HttpClient } from '@angular/common/http'
import { ClassProvider, Injectable, inject } from '@angular/core'
import { TranslateLoader as NgxTranslateLoader } from '@ngx-translate/core'
import { Observable, catchError, combineLatest, map, of } from 'rxjs'

import { environment } from 'apps/web/environments'
import { normalizeDictionary } from './utils'

@Injectable({ providedIn: 'root' })
export class TranslationLoader implements NgxTranslateLoader {
  public static provide(): ClassProvider {
    return {
      provide: NgxTranslateLoader,
      useClass: TranslationLoader,
    }
  }

  private http = inject(HttpClient)

  public getTranslation(lang: string): Observable<any> {
    const gameLocales = this.http
      .get<Record<string, string>>(`${environment.nwDataUrl}/localization/${lang}.json`)
      .pipe(
        catchError((err) => {
          console.error(err)
          return of(null)
        }),
      )
    const appLocales = this.http.get<Record<string, string>>(`assets/i18n/${lang.toLowerCase()}.json`).pipe(
      catchError((err) => {
        console.error(err)
        return of(null)
      }),
    )
    return combineLatest([gameLocales, appLocales]).pipe(
      map(([game, app]) => {
        return {
          ...normalizeDictionary(game || {}),
          ...(app || {}),
        }
      }),
    )
  }
}
