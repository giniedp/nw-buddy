import { inject } from '@angular/core'
import { signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { PerkData } from '@nw-data/generated'
import { ItemInstancesDB } from '../items'
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
      const itemDB = inject(ItemInstancesDB)
      return {
        patchItemInstance(patchValue: Partial<ItemInstanceRecord>) {
          return itemDB.update(itemInstance().id, {
            ...itemInstance(),
            ...patchValue,
          })
        },
        destroyItemInstance() {
          return itemDB.destroy(itemInstance().id)
        },
      }
    }),
    withMethods(({ itemInstance, patchItemInstance }) => {
      return {
        updateItemInstancePerk: async (perkKey: string, perk: PerkData) => {
          const perks = makeCopy(itemInstance()).perks || {}
          if (perk) {
            perks[perkKey] = perk.PerkID
          } else {
            delete perks[perkKey]
          }
          await patchItemInstance({ perks })
        },
      }
    }),
  )
}

function makeCopy<T>(it: T) {
  return JSON.parse(JSON.stringify(it)) as T
}
