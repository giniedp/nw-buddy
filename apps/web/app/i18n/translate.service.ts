import { Injectable, inject } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { patchState, signalState } from '@ngrx/signals'
import { TranslateService as NgxService } from '@ngx-translate/core'
import { uniq } from 'lodash'
import {
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
import { selectStream } from '~/utils'
import { LocaleService } from './locale.service'
import { normalizeLookupKey } from './utils'
import { DomSanitizer } from '@angular/platform-browser'

@Injectable({ providedIn: 'root' })
export class TranslateService {
  public readonly sanitizer = inject(DomSanitizer)
  private state = signalState({
    isLoaded: false,
    languages: [] as string[],
  })
  private localeReady$ = toObservable(this.state.languages)

  public constructor(
    public readonly locale: LocaleService,
    public readonly service: NgxService,
  ) {
    service.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
      this.onLanguageLoaded(event.lang)
    })
  }

  private onLanguageLoaded(value: string) {
    patchState(this.state, ({ languages }) => {
      return {
        isLoaded: true,
        languages: uniq([...languages, value]),
      }
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
        }),
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
      }),
    )
  }

  public isLocaleReady(lang: string) {
    return selectStream(this.localeReady$, (list) => list.includes(lang))
  }

  public whenLocaleReady(lang: string) {
    return firstValueFrom(this.isLocaleReady(lang).pipe(filter((it) => it)))
  }

  public use(locale: string) {
    return this.service.use(locale).pipe(
      switchMap(() => {
        this.locale.use(locale)
        this.onLanguageLoaded(locale)
        return this.whenLocaleReady(locale)
      }),
    )
  }
}
