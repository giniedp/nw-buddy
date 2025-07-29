import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { EquipSlotId } from '@nw-data/common'
import { combineLatest, map, of, switchMap } from 'rxjs'
import {
  ItemsService,
  WithGearsetPropsState,
  WithItemInstanceMethodsState,
  withGearsetMethods,
  withGearsetProps,
  withItemInstanceMethods,
} from '~/data'
import { GearsetsService } from '~/data/gearsets/gearsets.service'

export interface ItemDetailPageState extends WithGearsetPropsState, WithItemInstanceMethodsState {
  slotId: EquipSlotId
  gearsetLoaded: boolean
  itemInstanceLoaded: boolean
}
export const ItemDetailPageStore = signalStore(
  withState<ItemDetailPageState>({
    defaultLevel: null,
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
    const gears = inject(GearsetsService)
    const items = inject(ItemsService)
    return {
      connect: rxMethod<{ slotId: string; gearsetId: string; itemId: string; userId: string }>((source) => {
        return source.pipe(
          switchMap(({ slotId, gearsetId, itemId, userId }) => {
            return combineLatest({
              slotId: of(slotId as EquipSlotId),
              gearset: gears.observeRecord({ userId, id: gearsetId }),
              itemInstance: items.observeRecord({ userId, id: itemId }),
            })
          }),
          map(({ slotId, gearset, itemInstance }) => {
            patchState(state, {
              slotId,
              gearset,
              gearsetLoaded: true,
              itemInstance,
              itemInstanceLoaded: true,
            })
          }),
        )
      }),
    }
  }),
  withComputed(({ gearsetLoaded, itemInstanceLoaded }) => {
    return {
      isLoaded: computed(() => gearsetLoaded() && itemInstanceLoaded()),
    }
  }),
)
