import { computed, effect, inject, Injector, runInInjectionContext, signal, Signal, untracked } from '@angular/core'
import {
  patchState,
  Prettify,
  SignalStoreFeature,
  signalStoreFeature,
  SignalStoreFeatureResult,
  StateSignals,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, EMPTY, Observable, Subject, switchMap, tap, Unsubscribable } from 'rxjs'

export interface WithResourceState {
  status: 'idle' | 'loading' | 'loaded' | 'error'
  error: any
}

export type WithResourceConfig<P, R> = {
  load: (arg: P) => Promise<R> | Observable<R>
}

export type WithResourceMethods<P, R> = {
  load: ((input?: P | Signal<P> | Observable<P>) => any)
  loadDone: (data: R) => void
  loadError: (err: any) => void
  refresh: () => void
  whenDoneLoading: () => Promise<void>
}

export type WithResourceComputed = {
  hasError: Signal<boolean>
  isLoading: Signal<boolean>
  isLoaded: Signal<boolean>
}

export function withStateLoader<Input extends SignalStoreFeatureResult, P>(
  factory: (
    store: Prettify<StateSignals<Input['state']> & Input['props'] & Input['methods']>,
  ) => WithResourceConfig<P, Input['state']>,
): SignalStoreFeature<
  Input,
  {
    state: WithResourceState
    props: WithResourceComputed
    methods: WithResourceMethods<P, Input['state']>
  }
> {
  return signalStoreFeature(
    withState<WithResourceState>({
      status: 'idle',
      error: null,
    }),
    withComputed(({ status, error }) => {
      const isLoaded = signal(false)
      effect(() => {
        if (status() === 'loaded' || status() === 'error') {
          untracked(() => isLoaded.set(true))
        }
      })
      return {
        hasError: computed(() => !!error()),
        isLoading: computed(() => status() === 'loading'),
        isLoaded: isLoaded,
      }
    }),
    withMethods((state): WithResourceMethods<P, Input['state']> => {
      const r = factory(state as any)
      const refresh$ = new Subject<void>()
      const injector = inject(Injector)

      function loadError(err: any) {
        console.log(err)
        patchState(state, { status: 'error', error: err })
      }
      function loadDone(res: Input['state']) {
        patchState(state, {
          ...res,
          status: 'loaded',
          error: null,
        })
      }

      return {
        load: rxMethod<P>((input) =>
          input.pipe(
            // TODO: refresh
            switchMap((params) => {
              patchState(state, { status: 'loading', error: null })
              return r.load(params)
            }),
            tap((res) => {
              loadDone(res)
            }),
            catchError((err) => {
              loadError(err)
              return EMPTY
            }),
          ),
        ),
        loadDone,
        loadError,
        refresh: () => refresh$.next(),
        whenDoneLoading: () => {
          return new Promise<void>((res) => {
            runInInjectionContext(injector, () => {
              effect(() => {
                if (state.isLoaded()) {
                  res(null)
                }
              })
            })
          })
        },
      }
    }),
  )
}
