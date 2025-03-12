import { CommonModule } from '@angular/common'
import { Component, HostBinding, computed, input } from '@angular/core'
import { ComponentInputs, PropertyGridCell } from '../property-grid-cell.directive'

export function valueCell(options: ComponentInputs<ValueCellComponent>): PropertyGridCell {
  return {
    value: String(options.value),
    component: ValueCellComponent,
    componentInputs: options,
  }
}

@Component({
  selector: 'nwb-value-cell',
  template: `
    @if (isNumber && numberFormat()) {
      {{ printValue() | number: numberFormat() }}
    } @else {
      {{ value() }}
    }
  `,
  host: {
    class: 'inline',
  },
  imports: [CommonModule],
})
export class ValueCellComponent {
  public value = input<unknown>()
  public enum = input<boolean>()
  public numberFormat = input<string>('0.0-7')

  protected valueType = computed(() => typeof this.value())
  protected printValue = computed(() => String(this.value() || ''))

  @HostBinding('class.text-accent')
  protected get isNumber() {
    return this.valueType() === 'number'
  }

  @HostBinding('class.text-secondary')
  protected get isArrayOrEnum() {
    return this.enum() || Array.isArray(this.value())
  }

  @HostBinding('class.text-info')
  @HostBinding('class.text-bold')
  protected get isBoolean() {
    return this.valueType() === 'boolean'
  }
}
