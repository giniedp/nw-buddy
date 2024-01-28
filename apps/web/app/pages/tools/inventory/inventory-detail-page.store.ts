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
  gearsetLoaded: boolean
  itemInstanceLoaded: boolean
}
export const ItemDetailPageStore = signalStore(
  withState<ItemDetailPageState>({
    level: null,
    gearset: null,
    gearsetLoaded: false,
    itemInstance: null,
    itemInstanceLoaded: false,
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
          switchMap((id) => gearDB.observeByid(id)),
          map((record) => {
            patchState(state, {
              gearset: record,
              gearsetLoaded: true,
            })
          }),
        ),
      ),
      syncInstance: rxMethod<string>(
        pipe(
          switchMap((id) => itemDB.observeByid(id)),
          map((record) => {
            patchState(state, {
              itemInstance: record,
              itemInstanceLoaded: true,
            })
          }),
        ),
      ),
    }
  }),
  withComputed(({ gearsetLoaded, itemInstanceLoaded }) => {
    return {
      isLoaded: computed(() => gearsetLoaded() && itemInstanceLoaded()),
    }
  })
)
