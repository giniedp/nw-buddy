import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { EquipSlotId } from '@nw-data/common'
import { map, pipe, switchMap } from 'rxjs'
import {
  GearsetsDB,
  ItemInstancesDB,
  WithGearsetPropsState,
  WithItemInstanceMethodsState,
  withGearsetMethods,
  withGearsetProps,
  withItemInstanceMethods,
} from '~/data'

export interface ItemDetailPageState extends WithGearsetPropsState, WithItemInstanceMethodsState {
  slotId: EquipSlotId
}
export const ItemDetailPageStore = signalStore(
  withState<ItemDetailPageState>({
    level: null,
    gearset: null,
    itemInstance: null,
    slotId: null,
  }),
  withGearsetProps(),
  withGearsetMethods(),
  withItemInstanceMethods(),
  withComputed(({ itemInstance, resolvedSlots, slotId }) => {
    return {
      instance: computed(() => {
        return itemInstance() || resolvedSlots()?.find((it) => it.slot === slotId())?.instance
      }),
    }
  }),
  withMethods((state) => {
    const gearDB = inject(GearsetsDB)
    const itemDB = inject(ItemInstancesDB)
    return {
      syncSlot: rxMethod<EquipSlotId>(
        pipe(
          map((slotId) => {
            patchState(state, {
              slotId,
            })
          }),
        ),
      ),
      syncGearset: rxMethod<string>(
        pipe(
          switchMap((id) => gearDB.live((t) => t.get(id))),
          map((record) => {
            patchState(state, {
              gearset: record,
            })
          }),
        ),
      ),
      syncInstance: rxMethod<string>(
        pipe(
          switchMap((id) => itemDB.live((t) => t.get(id))),
          map((record) => {
            patchState(state, {
              itemInstance: record,
            })
          }),
        ),
      ),
    }
  }),
)
