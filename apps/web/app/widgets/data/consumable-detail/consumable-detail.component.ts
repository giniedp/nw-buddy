import { Component, inject, input } from '@angular/core'
import { ConsumableItemDefinitions } from '@nw-data/generated'
import { PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, tagsCell, valueCell } from '~/ui/property-grid/cells'
import { ConsumableDetailStore } from './consumable-detail.store'

@Component({
  standalone: true,
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
  protected store = inject(ConsumableDetailStore)
  public consumableId = input.required({
    transform: (value: string | ConsumableItemDefinitions): string => {
      const id = typeof value === 'string' ? value : value?.ConsumableID
      this.store.load({ id })
      return id
    },
  })

  public descriptor = gridDescriptor<ConsumableItemDefinitions>(
    {
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
