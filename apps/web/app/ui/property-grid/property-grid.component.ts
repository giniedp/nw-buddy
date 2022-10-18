import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { humanize } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-property-grid',
  templateUrl: './property-grid.component.html',
  styleUrls: ['./property-grid.component.scss'],
  imports: [CommonModule],
  providers: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'select-text'
  }
})
export class PropertyGridComponent {
  @Input()
  public set item(value: any) {
    this.rows = this.extractRows(value)
  }

  @Input()
  public humanizeNames: boolean

  @Input()
  public valueFormatter: (value: any, key?: string) => string

  @Input()
  public keyFormatter: (key: string) => string

  @Input()
  public numberFormat: string

  @Input()
  public rows: Array<{ key: string; value: any }> = []

  public constructor(private decimals: DecimalPipe) {
    //
  }

  protected formatValue(value: any, key: string) {
    if (this.valueFormatter) {
      value = this.valueFormatter(value, key)
    }
    if (this.numberFormat && typeof value === 'number') {
      value = this.decimals.transform(value, this.numberFormat)
    }
    return value
  }

  protected formatKey(key: string) {
    if (this.keyFormatter) {
      key = this.keyFormatter(key)
    }
    if (this.humanizeNames) {
      key = humanize(key)
    }
    return key
  }

  protected extractRows(value: any) {
    const result = (Array.isArray(value) ? value : [value])
      .filter((it) => !!it)
      .map((it) => Object.entries(it))
      .flat(1)
      .map(([key, value]) => ({ key, value }))

    return result
  }

}
