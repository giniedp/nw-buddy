import { inject } from '@angular/core'
import { patchState, signalStoreFeature, type, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { ObservableInput, combineLatest, map, pipe, switchMap } from 'rxjs'
import { NwDataService } from './nw-data'

export interface WithNwDataState<T> {
  nwData: T
  nwDataIsLoaded: boolean
}

export function withNwData<T>(fn: (db: NwDataService) => { [K in keyof T]: ObservableInput<T[K]> }) {
  return signalStoreFeature(
    withState<WithNwDataState<T>>({
      nwData: {} as any,
      nwDataIsLoaded: false,
    }),
    withMethods((state, db = inject(NwDataService)) => {
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
