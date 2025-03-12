import { Component, effect, inject, input, untracked } from '@angular/core'
import { ConsumableItemDefinitions } from '@nw-data/generated'
import { PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, tagsCell, valueCell } from '~/ui/property-grid/cells'
import { diffButtonCell } from '~/widgets/diff-tool'
import { ConsumableDetailStore } from './consumable-detail.store'

@Component({
  selector: 'nwb-consumable-detail',
  template: `
    <nwb-property-grid
      class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
      [item]="store.properties()"
      [descriptor]="descriptor"
    />
  `,
  imports: [PropertyGridModule],
  providers: [ConsumableDetailStore],
  host: {
    class: 'block',
  },
})
export class ConsumableDetailComponent {
  public store = inject(ConsumableDetailStore)
  public consumableId = input.required({
    transform: (value: string | ConsumableItemDefinitions): string => {
      return typeof value === 'string' ? value : value?.ConsumableID
    },
  })

  #fxLoad = effect(() => {
    const id = this.consumableId()
    untracked(() => this.store.load({ id }))
  })

  public descriptor = gridDescriptor<ConsumableItemDefinitions>(
    {
      ConsumableID: (value) => [
        valueCell({ value }),
        diffButtonCell({ record: this.store.consumable(), idKey: 'ConsumableID' }),
      ],
      DisplayStatusEffect: (value) => {
        return linkCell({
          value,
          routerLink: ['status-effect', value],
        })
      },
      MannequinTag: (value) => tagsCell({ value }),
      AddStatusEffects: (value) => {
        return value.map((id) => {
          return linkCell({
            value: id,
            routerLink: ['status-effect', id],
          })
        })
      },
    },
    (value) => valueCell({ value }),
  )
}
