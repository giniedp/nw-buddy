import { inject } from '@angular/core'
import { signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { PerkData } from '@nw-data/generated'
import { ItemsService } from './items.service'
import { ItemInstanceRecord } from './types'

export interface WithItemInstanceMethodsState {
  itemInstance: ItemInstanceRecord
}
export function withItemInstanceMethods() {
  return signalStoreFeature(
    {
      state: type<WithItemInstanceMethodsState>(),
    },
    withMethods(({ itemInstance }) => {
      const service = inject(ItemsService)
      return {
        patchItemInstance(patchValue: Partial<ItemInstanceRecord>) {
          return service.update(itemInstance().id, {
            ...itemInstance(),
            ...patchValue,
          })
        },
        destroyItemInstance() {
          return service.delete(itemInstance().id)
        },
      }
    }),
    withMethods(({ itemInstance, patchItemInstance }) => {
      return {
        updateItemInstancePerk: async (perkKey: string, perk: PerkData) => {
          const perks = makeCopy(itemInstance()).perks || {}
          perks[perkKey] = perk?.PerkID || null
          await patchItemInstance({ perks })
        },
      }
    }),
  )
}

function makeCopy<T>(it: T) {
  return JSON.parse(JSON.stringify(it)) as T
}
