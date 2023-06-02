import { Inject, Injectable, LOCALE_ID, StaticProvider } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'

@Injectable({ providedIn: 'root' })
export class LocaleService extends ComponentStore<{ locale: string }> {
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

  public get value(): string {
    return this.get(({ locale }) => locale)
  }

  public readonly value$ = this.select(({ locale }) => locale)

  public constructor(
    @Inject(LOCALE_ID)
    defaultLocale: string
  ) {
    super({ locale: normalizeLocale(defaultLocale) })
  }

  public use(language: string) {
    this.patchState({ locale: normalizeLocale(language) })
  }
}

function normalizeLocale(value: string) {
  return String(value || '').toLocaleLowerCase()
}
