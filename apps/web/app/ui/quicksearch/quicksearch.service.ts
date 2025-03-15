import { Injectable, InjectionToken, StaticProvider, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { Router } from '@angular/router'
import { patchState, signalState } from '@ngrx/signals'
import { tap } from 'rxjs'
import { shareReplayRefCount } from '~/utils'

export const QUICK_SEARCH_OPTIONS = new InjectionToken<QuicksearchOptions>('QUICK_SEARCH_OPTIONS', {
  providedIn: 'root',
  factory: () => ({}),
})

export interface QuicksearchOptions {
  queryParam?: string
}

export interface QuicksearchState {
  value: string
  active: boolean
}

@Injectable({
  providedIn: 'root',
})
export class QuicksearchService {
  public static provider(options: QuicksearchOptions): StaticProvider[] {
    return [
      {
        provide: QUICK_SEARCH_OPTIONS,
        useValue: options,
      },
      {
        provide: QuicksearchService,
      },
    ]
  }

  private router = inject(Router)
  private options = inject(QUICK_SEARCH_OPTIONS, {
    self: true,
    optional: true,
  })
  private state = signalState({
    active: false,
    value: getQueryParam(this.router, this.options),
  })
  public active = this.state.active
  public value = this.state.value
  public readonly active$ = toObservable(this.active)
  public readonly value$ = toObservable(this.value)
  public readonly query$ = this.value$
    .pipe(
      tap({
        subscribe: () => setTimeout(() => patchState(this.state, { active: true, value: this.getQueryParam() })),
        next: (value) => this.setQueryParam(value),
        unsubscribe: () => patchState(this.state, { active: false, value: '' }),
      }),
    )
    .pipe(shareReplayRefCount(1))
  public readonly query = toSignal(this.query$)

  public submit(value: string) {
    patchState(this.state, { value })
  }

  private getQueryParam() {
    return getQueryParam(this.router, this.options)
  }

  private setQueryParam(value: string) {
    if (!this.options?.queryParam) {
      return
    }
    const params = this.router.parseUrl(this.router.url).queryParams || {}
    if (!value) {
      delete params[this.options.queryParam]
    } else {
      params[this.options.queryParam] = encodeURIComponent(value)
    }
    this.router.navigate([], {
      queryParams: params,
      replaceUrl: true,
    })
  }
}

function getQueryParam(router: Router, options: QuicksearchOptions) {
  if (!options?.queryParam) {
    return ''
  }
  const value = router.parseUrl(router.url).queryParamMap.get(options.queryParam)
  return value ? decodeURIComponent(value) : ''
}
