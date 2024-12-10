import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { NwData } from '@nw-data/db'
import { combineLatest, map, ObservableInput, pipe, switchMap } from 'rxjs'
import { injectNwData } from './nw-data'

export interface WithNwDataState<T> {
  nwData: T
  nwDataIsLoaded: boolean
}

export function withNwData<T>(fn: (db: NwData) => { [K in keyof T]: ObservableInput<T[K]> }) {
  return signalStoreFeature(
    withState<WithNwDataState<T>>({
      nwData: {} as any,
      nwDataIsLoaded: false,
    }),
    withMethods((state) => {
      const db = injectNwData()
      return {
        loadNwData: rxMethod<void>(
          pipe(
            switchMap(() => combineLatest(fn(db))),
            map((result) => {
              patchState(state, {
                nwData: result,
                nwDataIsLoaded: true,
              })
            }),
          ),
        ),
      }
    }),
  )
}
