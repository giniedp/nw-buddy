import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ReplaySubject, map } from 'rxjs'
import { humanize } from '~/utils'
import { TooltipModule } from '../tooltip'
import { PropertyGridCell, PropertyGridCellContext, PropertyGridCellDirective } from './property-grid-cell.directive'
import { PropertyGridValueDirective } from './property-grid-value.directive'
import { NwModule } from '~/nw'

export interface PropertyGridEntry {
  key: string
  value: any
  valueType: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function'
}

@Component({
  standalone: true,
  selector: 'nwb-property-grid',
  templateUrl: './property-grid.component.html',
  styleUrls: ['./property-grid.component.scss'],
  imports: [NwModule, CommonModule, RouterModule, TooltipModule, PropertyGridCellDirective, PropertyGridValueDirective],
  providers: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'select-text',
  },
})
export class PropertyGridComponent<T = any> {

  public readonly item = input<T>(null)
  public readonly entries = computed(() => this.extractEntries(this.item()))

  @Input()
  public humanizeNames: boolean

  @Input()
  public entriesExtractor: (value: T) => PropertyGridEntry[]

  @Input()
  public valueFormatter: PropertyGridValueFormatterFn<T>

  @Input()
  public keyFormatter: (key: keyof T) => string | PropertyGridCell

  @Input()
  public numberFormat: string = '0.0-7'

  public constructor(private decimals: DecimalPipe) {
    //
  }

  protected extractEntries(value: T): PropertyGridEntry[] {
    if (this.entriesExtractor) {
      return this.entriesExtractor(value)
    }
    if (!value) {
      return []
    }
    return Object.entries(value).map(([key, value]) => {
      return {
        key,
        value,
        valueType: typeof value,
      }
    })
  }

  protected formatValue({ key, value, valueType }: PropertyGridEntry): PropertyGridCell[] {
    let cell: string | PropertyGridCell | PropertyGridCell[]
    if (this.valueFormatter) {
      cell = this.valueFormatter(value, key as keyof T, valueType)
    } else if (this.numberFormat && typeof value === 'number') {
      cell = {
        value: this.decimals.transform(value, this.numberFormat),
        accent: true,
      }
    } else {
      cell = {
        value: String(value),
        accent: valueType === 'bigint' || valueType === 'number',
        info: valueType === 'boolean',
        bold: valueType === 'boolean',
      }
    }

    if (typeof cell === 'string') {
      return [{ value: cell }]
    }
    if (Array.isArray(cell)) {
      return cell
    }
    return [cell]
  }

  protected formatKey({ key }: PropertyGridEntry): PropertyGridCell[] {
    let cell: string | PropertyGridCell | PropertyGridCell[]
    if (this.keyFormatter) {
      cell = this.keyFormatter(key as keyof T)
    } else if (this.humanizeNames) {
      cell = humanize(key)
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

export type PropertyGridValueFormatterFn<T> = (
  value: any,
  key?: keyof T,
  type?: PropertyGridEntry['valueType'],
) => string | PropertyGridCell | PropertyGridCell[]
