import { Injectable } from '@angular/core'
import { TranslateService as NgxService } from '@ngx-translate/core'
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  isObservable,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs'
import { LocaleService } from './locale.service'
import { normalizeLookupKey } from './utils'

@Injectable({ providedIn: 'root' })
export class TranslateService {
  public constructor(public readonly locale: LocaleService, public readonly service: NgxService) {
    //
  }

  public observe(key: string | string[] | Observable<string | string[]>) {
    return combineLatest({
      locale: this.locale.value$,
      key: isObservable(key) ? key : of(key),
    })
      .pipe(
        switchMap(({ key }) => {
          key = normalizeLookupKey(key)
          if (Array.isArray(key)) {
            return combineLatest(key.map((it) => (it ? this.service.get(it) : of(it)))).pipe(map((it) => it.join(' ')))
          }
          return key ? this.service.get(key) : of(key)
        })
      )
      .pipe(distinctUntilChanged())
  }

  public get(key: string | string[]) {
    key = normalizeLookupKey(key)
    if (Array.isArray(key)) {
      return key
        .map((it) => {
          return it ? this.service.instant(it) : it
        })
        .join(' ')
    }
    return key ? this.service.instant(key) : key
  }

  public async getAsync(key: string) {
    key = normalizeLookupKey(key)
    return firstValueFrom(this.service.get(key))
  }

  public use(locale: string) {
    return this.service.use(locale).pipe(tap(() => this.locale.use(locale)))
  }
}
