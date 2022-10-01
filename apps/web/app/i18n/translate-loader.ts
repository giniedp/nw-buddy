import { Injectable, Type } from '@angular/core'
import { Observable, of } from 'rxjs'

@Injectable()
export class TranslateLoader {
  public static provideClass(type: Type<TranslateLoader>) {
    return {
      provide: TranslateLoader,
      useClass: type
    }
  }

  public loadTranslations(lang: string): Observable<Record<string, string>> {
    return of({})
  }
}
