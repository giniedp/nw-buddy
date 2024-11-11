import { computed, effect, Signal, untracked } from '@angular/core'
import { patchState, signalState } from '@ngrx/signals'

export interface ApiResourceOptions<P, R> {
  request?: () => P
  loader: (arg: { request: P }) => Promise<R>
}

export type ApiResourceStatus = 'idle' | 'loading' | 'loaded' | 'error'
export interface ApiResource<R> {
  refresh: () => void
  value: Signal<R>
  status: Signal<ApiResourceStatus>
  error: Signal<Error>
  hasError: Signal<boolean>
  isLoading: Signal<boolean>
  isLoaded: Signal<boolean>
}

export function apiResource<P, R>({ request, loader }: ApiResourceOptions<P, R>): ApiResource<R> {
  const state = signalState({
    track: -1,
    params: undefined as P,
    value: undefined as R,
    status: 'idle' as ApiResourceStatus,
    error: undefined as Error,
  })
  effect(() => {
    const params = request ? request() : undefined
    untracked(() => patchState(state, { params }))
  })
  effect(() => {
    const params = state.params()
    untracked(() => load(params))
  })

  function load(params: P) {
    const ref = state.track() + 1
    patchState(state, { track: ref, status: 'loading', error: undefined })
    Promise.resolve(loader({ request: params }))
      .then((data) => {
        if (ref !== state.track()) {
          return
        }
        patchState(state, { status: 'loaded', value: data, error: undefined, track: -1 })
      })
      .catch((err) => {
        if (ref !== state.track()) {
          return
        }
        patchState(state, { status: 'error', error: err, track: -1 })
      })
  }

  return {
    refresh: () => load(state.params()),
    value: computed(() => state.value()),
    status: computed(() => state.status()),
    error: computed(() => state.error()),
    hasError: computed(() => !!state.error()),
    isLoading: computed(() => state.status() === 'loading'),
    isLoaded: computed(() => state.status() === 'loaded' || !!state.value()),
  }
}
