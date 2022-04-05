import { Inject, Injectable, LOCALE_ID, OnDestroy, StaticProvider } from '@angular/core'
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class LocaleService implements OnDestroy {
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
    return this.currentValue
  }

  public get change(): Observable<string> {
    return this.currentValue$
  }

  private currentValue: string
  private currentValue$: BehaviorSubject<string>
  private destroy$ = new Subject()

  public constructor(
    @Inject(LOCALE_ID)
    defaultLocale: string
  ) {
    this.currentValue$ = new BehaviorSubject(defaultLocale)
    this.currentValue$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.currentValue = value
    })
  }

  public use(language: string) {
    this.currentValue$.next(language)
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
