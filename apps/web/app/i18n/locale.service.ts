import { Inject, Injectable, LOCALE_ID, StaticProvider } from '@angular/core'
import { BehaviorSubject, defer, distinctUntilChanged } from 'rxjs'
import { shareReplayRefCount } from '../utils'

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

  public get value(): string {
    return this.subject$.value
  }

  public readonly value$ = defer(() => this.subject$).pipe(distinctUntilChanged()).pipe(shareReplayRefCount(1))

  private subject$: BehaviorSubject<string>

  public constructor(
    @Inject(LOCALE_ID)
    defaultLocale: string
  ) {
    this.subject$ = new BehaviorSubject(normalizeLocale(defaultLocale))
  }

  public use(language: string) {
    this.subject$.next(normalizeLocale(language))
  }
}

function normalizeLocale(value: string) {
  return String(value || '').toLocaleLowerCase()
}
