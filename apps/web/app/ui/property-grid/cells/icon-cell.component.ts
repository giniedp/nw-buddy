import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'
import { NwModule } from '~/nw'
import { ComponentInputs, PropertyGridCell } from '../property-grid-cell.directive'

export function iconCell({ value, size }: ComponentInputs<IconCellComponent>): PropertyGridCell {
  return {
    value: String(value),
    component: IconCellComponent,
    componentInputs: {
      value,
      size,
    },
  }
}

@Component({
  selector: 'nwb-text-cell',
  template: `
    @if (value()) {
      <img [nwImage]="value()" class="max-w-full" [ngClass]="size()" />
      <div class="w-full text-xs truncate">{{ value() }}</div>
    }
  `,
  host: {
    class: 'inline',
  },
  imports: [CommonModule, NwModule],
})
export class IconCellComponent {
  public value = input<string>()
  public size = input<string>()
}
