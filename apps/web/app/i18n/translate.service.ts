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
          if (!key || !key.length) {
            return of(null)
          }
          if (Array.isArray(key)) {
            return combineLatest(key.map((it) => this.getWatched(it))).pipe(map((it) => it.join(' ')))
          }
          return this.getWatched(key)
        })
      )
      .pipe(distinctUntilChanged())
  }

  public get(key: string | string[]): string {
    if (!key || !key.length) {
      return ''
    }
    if (Array.isArray(key)) {
      return key.map((it) => this.getSync(it)).join(' ')
    }
    return this.getSync(key)
  }

  private getSync(key: string): string {
    if (!key) {
      return key
    }
    const lookupKey = normalizeLookupKey(key)
    const result = this.service.instant(lookupKey)
    if (result === lookupKey) {
      // translation key is missing, return untransformed key
      return key
    }
    return result
  }

  public async getAsync(key: string): Promise<string> {
    if (!key) {
      return key
    }
    const lookupKey = normalizeLookupKey(key)
    const result = await firstValueFrom(this.service.get(lookupKey))
    if (result === lookupKey) {
      // translation key is missing, return untransformed key
      return key
    }
    return result
  }

  private getWatched(key: string): Observable<string> {
    if (!key) {
      return of(key)
    }
    const lookupKey = normalizeLookupKey(key)
    return this.service.get(lookupKey).pipe(
      map((result) => {
        if (result === lookupKey) {
          // translation key is missing, return untransformed key
          return key
        }
        return result
      })
    )
  }

  public use(locale: string) {
    return this.service.use(locale).pipe(tap(() => this.locale.use(locale)))
  }
}
