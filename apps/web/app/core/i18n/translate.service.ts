import { Injectable, OnDestroy, Optional } from '@angular/core'
import {
  combineLatest,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs'
import { LocaleService } from './locale.service'
import { TranslateSource } from './translate-source'

@Injectable({ providedIn: 'root' })
export class TranslateService implements OnDestroy {
  private data: Map<string, Map<string, string>> = new Map()
  private destroy$ = new Subject()
  private change$ = new Subject()

  public constructor(
    private locale: LocaleService,
    @Optional()
    private source: TranslateSource
  ) {
    this.attachLoader()
  }

  public observe(key: string | Observable<string>, locale?: string) {
    const key$ = typeof key === 'string' ? of(key) : key
    return combineLatest([key$, this.change$])
      .pipe(map(([k]) => this.get(k, locale)))
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

  public async getAync(key: string, locale?: string) {
    return firstValueFrom(this.observe(key, locale))
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public merge(locale: string, data: Record<string, string>) {
    const target = (this.data.get(locale) || new Map<string, string>())
    Object.entries(data).forEach(([key, value]) => {
      key = key.toLowerCase()
      if (target.get(key)) {
        console.warn(`dublicate translate key:`, key)
      }
      target.set(key, value)
    })
    this.data.set(locale, target)
    this.change$.next(null)
  }

  private attachLoader() {
    if (!this.source) {
      this.change$.next(null)
      return
    }
    this.locale.change
      .pipe(switchMap((locale) => combineLatest([of(locale), this.source.loadTranslations(locale)])))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([locale, data]) => {
        this.merge(locale, data)
      })
  }
}
