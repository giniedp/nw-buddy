import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { ConsumableItemDefinitions } from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { rejectKeys } from '~/utils'

export interface ConsumableDetailState {
  consumable: ConsumableItemDefinitions
}

export const ConsumableDetailStore = signalStore(
  withState<ConsumableDetailState>({
    consumable: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: { id: string }) =>
        combineLatest({
          consumable: db.consumableItemsById(data.id),
        }),
    }
  }),
  withComputed(({ consumable }) => {
    return {
      properties: computed(() => selectProperties(consumable())),
    }
  }),
)
function selectProperties(item: ConsumableItemDefinitions) {
  return rejectKeys(item, (key) => !item[key] || key.startsWith('$'))
}
