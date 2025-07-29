import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, TemplateRef, computed, inject, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { TooltipModule } from '../tooltip'
import { valueCell } from './cells'
import { PropertyGridCell, PropertyGridCellContext } from './property-grid-cell.directive'
import { PropertyGridDescriptorFn } from './property-grid-descriptor'
import { PropertyGridEntry } from './property-grid-entry'

@Component({
  selector: 'nwb-property-grid',
  templateUrl: './property-grid.component.html',
  styleUrl: './property-grid.component.css',
  imports: [NwModule, CommonModule, RouterModule, TooltipModule],
  providers: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'select-text',
  },
})
export class PropertyGridComponent<T = any> {
  protected injector = inject(Injector)

  public readonly item = input.required<T>()
  public readonly descriptor = input<PropertyGridDescriptorFn<T>>(null)
  public readonly templates = input<Partial<Record<keyof T, TemplateRef<PropertyGridCellContext>>>>(null)
  public readonly keyFormatter = input<(key: keyof T) => string | PropertyGridCell>(null)

  protected entries = computed(() => getEntries(this.item()))

  protected describeValue({ key, value, valueType }: PropertyGridEntry): PropertyGridCell[] {
    const templates = this.templates()
    const descriptor = this.descriptor()
    let cell: PropertyGridCell | PropertyGridCell[]
    if (templates && key in templates) {
      cell = {
        template: templates[key],
        value: String(value),
      }
    } else if (descriptor) {
      cell = descriptor(value, key as keyof T, valueType)
    } else {
      cell = valueCell({ value })
    }
    return Array.isArray(cell) ? cell : [cell]
  }

  protected formatKey({ key }: PropertyGridEntry): PropertyGridCell[] {
    const keyFormatter = this.keyFormatter()
    let cell: string | PropertyGridCell | PropertyGridCell[]
    if (keyFormatter) {
      cell = keyFormatter(key as keyof T)
    } else {
      cell = String(key)
    }

    if (typeof cell === 'string') {
      return [{ value: cell }]
    }
    if (Array.isArray(cell)) {
      return cell
    }
    return [cell]
  }
}

function getEntries(item: unknown) {
  if (!item) {
    return []
  }
  return Object.entries(item).map(([key, value]) => {
    return {
      key,
      value,
      valueType: typeof value,
    }
  })
}
