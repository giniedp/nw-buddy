import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { EquipSlotId } from '@nw-data/common'
import { map, pipe } from 'rxjs'
import { GearsetRecord } from './types'
import { withGearsetMethods } from './with-gearset-methods'
import { withGearsetSlot } from './with-gearset-slot'

export interface GearsetSlotState {
  gearset: GearsetRecord
  slotId: EquipSlotId
}

export type GearsetSlotStore = InstanceType<typeof GearsetSlotStore>
export const GearsetSlotStore = signalStore(
  withState<GearsetSlotState>({
    gearset: null,
    slotId: null,
  }),
  withGearsetMethods(),
  withGearsetSlot(),
  withMethods((state) => {
    return {
      connect: rxMethod<GearsetSlotState>(
        pipe(
          map(({ gearset, slotId }) => {
            patchState(state, {
              gearset: gearset,
              slotId: slotId,
            })
          }),
        ),
      ),
    }
  }),
)
