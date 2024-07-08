import { Inject, Injectable, LOCALE_ID, StaticProvider, computed, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { normalizeLocale } from './utils'

@Injectable({ providedIn: 'root' })
export class LocaleService {
  public static withLocale(value: string): StaticProvider[] {
    return [
      {
        provide: LOCALE_ID,
        useValue: value,
      },
      {
        provide: LocaleService,
      },
    ]
  }

  public value = signal<string>(null)
  public defaultvalue = signal<string>(null)

  public readonly value$ = toObservable(this.value)

  public constructor(
    @Inject(LOCALE_ID)
    defaultLocale: string,
  ) {
    this.defaultvalue.set(defaultLocale)
    this.use(defaultLocale)
  }

  public use(value: string) {
    this.value.set(normalizeLocale(value))
  }
}
