import { Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TranslateService as NgxService } from '@ngx-translate/core'
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  isObservable,
  map,
  of,
  switchMap,
} from 'rxjs'
import { LocaleService } from './locale.service'
import { normalizeLookupKey } from './utils'

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private localeReady$ = new BehaviorSubject<string[]>([])

  public constructor(public readonly locale: LocaleService, public readonly service: NgxService) {
    service.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
      this.localeReady$.next([...this.localeReady$.value, event.lang])
    })
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

  public isLocaleReady(lang: string) {
    return this.localeReady$.pipe(map((it) => it.includes(lang)))
  }

  public whenLocaleReady(lang: string) {
    return firstValueFrom(this.isLocaleReady(lang).pipe(filter((it) => it)))
  }

  public use(locale: string) {
    return this.service.use(locale).pipe(
      switchMap(() => {
        this.locale.use(locale)
        return this.whenLocaleReady(locale)
      })
    )
  }
}
