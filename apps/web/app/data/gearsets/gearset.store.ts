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

export type GearsetSection = 'panel1' | 'panel2' | 'skills' | 'armor' | 'jewelry' | 'weapons'
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
      setShowCalculator: (value: boolean) => {
        patchState(state, { showCalculator: value })
      },
      setShowItemInfo: (value: boolean) => {
        patchState(state, { showItemInfo: value })
      },
    }
  }),
)

const VALID_SECTIONS: GearsetSection[] = ['panel1', 'panel2', 'skills', 'armor', 'jewelry', 'weapons']
export function getGearsetSections(): GearsetSection[] {
  return [...VALID_SECTIONS]
}
export function toggleGearsetSection(sections: GearsetSection[], value: GearsetSection): GearsetSection[] {
  if (!value || !VALID_SECTIONS.includes(value)) {
    return sections
  }
  if (!sections?.length) {
    sections = [...VALID_SECTIONS]
  }
  if (sections.includes(value)) {
    sections = sections.filter((it) => it === value)
  } else {
    sections = [...sections, value]
  }
  if (sections.length == 6) {
    sections = null
  }
  return sections
}
