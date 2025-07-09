import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { catchError, map, of, pipe, switchMap } from 'rxjs'

import { inject } from '@angular/core'
import { GearsetsService } from './gearsets.service'
import { GearsetRecord } from './types'
import { withGearsetMethods } from './with-gearset-methods'
import { withGearsetProps } from './with-gearset-props'
import { withGearsetToMannequin } from './with-gearset-to-mannequin'

export interface GearsetStoreState {
  defaultLevel: number
  gearset: GearsetRecord
  isLoaded: boolean
  isLoading: boolean
  showCalculator: boolean
  showItemInfo: boolean
}

export type GearsetStore = InstanceType<typeof GearsetStore>
export const GearsetStore = signalStore(
  { protectedState: false },
  withState<GearsetStoreState>({
    defaultLevel: NW_MAX_CHARACTER_LEVEL,
    gearset: null,
    isLoaded: false,
    isLoading: false,
    showCalculator: false,
    showItemInfo: true,
  }),
  withGearsetProps(),
  withGearsetMethods(),
  withGearsetToMannequin(),
  withMethods((state) => {
    const service = inject(GearsetsService)
    return {
      connectGearsetId: rxMethod<{ userId: string; id: string }>(
        pipe(
          switchMap((source) => {
            return service.observeRecord(source)
          }),
          catchError((err) => {
            console.error(err)
            return of(null)
          }),
          map((gearset) => {
            patchState(state, { gearset: gearset, isLoaded: true })
          }),
        ),
      ),
      connectGearset: rxMethod<GearsetRecord>(
        pipe(
          map((gearset) => {
            patchState(state, { gearset: gearset, isLoaded: true })
          }),
        ),
      ),
      connectIsLoading: rxMethod<boolean>(
        pipe(
          map((value) => {
            patchState(state, { isLoading: value })
          }),
        ),
      ),
      connectLevel: rxMethod<number>(
        pipe(
          map((level) => {
            patchState(state, { defaultLevel: level })
          }),
        ),
      ),
    }
  }),
)
