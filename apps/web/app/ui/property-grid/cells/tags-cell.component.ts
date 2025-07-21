import { Component, computed, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ComponentInputs, PropertyGridCell } from '../property-grid-cell.directive'

export function tagsCell(options: ComponentInputs<TagsCellComponent>): PropertyGridCell {
  return {
    value: String(options.value),
    component: TagsCellComponent,
    componentInputs: options,
  }
}

@Component({
  selector: 'nwb-tags-cell',
  template: `
    @for (tag of tags(); track $index) {
      <span class="badge badge-sm bg-secondary/50 px-1">{{ tag }}</span>
    }
  `,
  host: {
    class: 'flex flex-row flex-wrap gap-1',
  },
  imports: [NwModule, RouterModule],
})
export class TagsCellComponent {
  public value = input<string | string[]>()
  protected tags = computed(() => {
    let value = this.value()
    if (Array.isArray(value)) {
      return value
    }
    if (value) {
      return [value]
    }
    return null
  })
}
