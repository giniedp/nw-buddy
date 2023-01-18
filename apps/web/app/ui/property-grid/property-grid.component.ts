import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { map, ReplaySubject } from 'rxjs'
import { humanize } from '~/utils'
import { PropertyGridCell, PropertyGridCellContext, PropertyGridCellDirective } from './property-grid-cell.directive'

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
  imports: [CommonModule, RouterModule, PropertyGridCellDirective],
  providers: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'select-text',
  },
})
export class PropertyGridComponent<T = any> {
  @Input()
  public set item(value: T) {
    this.item$.next(value)
  }

  @Input()
  public humanizeNames: boolean

  @Input()
  public entriesExtractor: (value: T) => PropertyGridEntry[]

  @Input()
  public valueFormatter: (value: any, key?: keyof T, type?: PropertyGridEntry['valueType']) => string | PropertyGridCell | PropertyGridCell[]

  @Input()
  public keyFormatter: (key: keyof T) => string | PropertyGridCell

  @Input()
  public numberFormat: string

  protected item$ = new ReplaySubject<any>(1)
  protected entries$ = this.item$.pipe(map((item) => this.extractEntries(item)))
  protected trackBy = (i: number) => i

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

  protected formatValue({ key, value, valueType}: PropertyGridEntry): PropertyGridCellContext {
    let cell: string | PropertyGridCell | PropertyGridCell[]
    if (this.valueFormatter) {
      cell = this.valueFormatter(value, key as keyof T, valueType)
    } else if (this.numberFormat && typeof value === 'number') {
      cell = {
        value: this.decimals.transform(value, this.numberFormat),
        accent: true
      }
    } else {
      cell = {
        value: String(value),
        accent: valueType === 'bigint' || valueType === 'number',
        info: valueType === 'boolean',
        bold: valueType === 'boolean'
      }
    }

    if (typeof cell === 'string') {
      return this.toContext([{ value: cell }])
    }
    if (Array.isArray(cell)) {
      return this.toContext(cell)
    }
    return this.toContext([cell])
  }

  protected formatKey({ key }: PropertyGridEntry): PropertyGridCellContext {
    let cell: string | PropertyGridCell | PropertyGridCell[]
    if (this.keyFormatter) {
      cell = this.keyFormatter(key as keyof T)
    } else if (this.humanizeNames) {
      cell = humanize(key)
    } else {
      cell = String(key)
    }

    if (typeof cell === 'string') {
      return this.toContext([{ value: cell }])
    }
    if (Array.isArray(cell)) {
      return this.toContext(cell)
    }
    return this.toContext([cell])
  }

  protected toContext(cells: PropertyGridCell[]): PropertyGridCellContext {
    return {
      $implicit: cells,
      cell: cells[0],
      cells: cells
    }
  }
}
