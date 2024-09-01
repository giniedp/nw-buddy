import { Directive, input } from '@angular/core'
import { ConsumableDetailStore } from './consumable-detail.store'
import { ConsumableItemDefinitions } from '@nw-data/generated'

@Directive({
  standalone: true,
  selector: '[nwbConsumableDetail]',
  exportAs: 'consumableDetail',
})
export class ConsumableDetailDirective extends ConsumableDetailStore {
  public id = input(null, {
    alias: 'nwbConsumableDetail',
    transform: (value: string | ConsumableItemDefinitions): string => {
      const id = typeof value === 'string' ? value : value?.ConsumableID
      this.load({ id })
      return id
    },
  })
}
