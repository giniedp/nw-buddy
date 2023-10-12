import { HttpClient } from '@angular/common/http'
import { ClassProvider, Injectable } from '@angular/core'
import { TranslateLoader as NgxTranslateLoader } from '@ngx-translate/core'
import { Observable, catchError, combineLatest, map, of } from 'rxjs'
import { NwDataService } from '~/nw/nw-data.service'
import { normalizeDictionary } from './utils'

@Injectable({ providedIn: 'root' })
export class TranslationLoader implements NgxTranslateLoader {
  public static provide(): ClassProvider {
    return {
      provide: NgxTranslateLoader,
      useClass: TranslationLoader,
    }
  }

  public constructor(private http: HttpClient, private nwData: NwDataService) {
    //
  }

  public getTranslation(lang: string): Observable<any> {
    const gameLocales = this.nwData.loadTranslations(lang).pipe(
      catchError((err) => {
        console.error(err)
        return of(null)
      })
    )
    const appLocales = this.http.get(`assets/i18n/${lang.toLowerCase()}.json`).pipe(
      catchError((err) => {
        console.error(err)
        return of(null)
      })
    )
    return combineLatest([gameLocales, appLocales]).pipe(
      map(([game, app]) => {
        return {
          ...normalizeDictionary(game || {}),
          ...(app || {}),
        }
      })
    )
  }
}
