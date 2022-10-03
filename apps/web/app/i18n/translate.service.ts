import { Injectable, OnDestroy } from '@angular/core'
import {
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  isObservable,
  map,
  Observable,
  of, startWith,
  Subject, take
} from 'rxjs'
import { LocaleService } from './locale.service'
import { TranslateLoader } from './translate-loader'

@Injectable({ providedIn: 'root' })
export class TranslateService implements OnDestroy {
  private data: Map<string, Map<string, string>> = new Map()
  private destroy$ = new Subject()
  private change$ = new Subject()

  public constructor(
    public readonly locale: LocaleService,
    public readonly loader: TranslateLoader
  ) {
    //
  }

  public observe(key: string | Observable<string>, locale?: string | Observable<string>) {
    if (!locale) {
      locale = this.locale.value$
    }
    return combineLatest({
      key: isObservable(key) ? key : of(key),
      locale: isObservable(locale) ? locale : of(locale),
      change: this.change$.pipe(startWith(null))
    })
    .pipe(map(({ key, locale }) => this.get(key, locale)))
    .pipe(distinctUntilChanged())
  }

  public get(key: string, locale: string = this.locale.value) {
    if (!key) {
      return ''
    }
    const bucket = this.data.get(locale)
    const value = bucket?.get(key.toLowerCase())
    return value ?? key
  }

  public async getAsync(key: string, locale?: string) {
    return firstValueFrom(this.observe(key, locale))
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public use(locale: string) {
    this.loadTranslations(locale).pipe(take(1)).subscribe((data) => {
      this.merge(locale, data)
      this.locale.use(locale)
    })
  }

  public merge(locale: string, data: Record<string, string>) {
    const target = (this.data.get(locale) || new Map<string, string>())
    Object.entries(data).forEach(([key, value]) => {
      key = key.toLowerCase()
      if (!target.has(key)) {
        target.set(key, value)
      }
    })
    this.data.set(locale, target)
    this.change$.next(null)
  }

  private loadTranslations(locale: string) {
    return this.loader.loadTranslations(locale)
  }
}
