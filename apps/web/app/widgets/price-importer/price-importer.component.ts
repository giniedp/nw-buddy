import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { NwPricesImporterComponent } from './nw-marketprices-importer.component'
import { PriceImporterJsonComponent } from './price-importer-json.component'

type ImporterType = 'json' | 'nwmp'

@Component({
  standalone: true,
  selector: 'nwb-price-importer',
  templateUrl: './price-importer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, PriceImporterJsonComponent, NwPricesImporterComponent],
  host: {
    class: 'layout-col container bg-base-300 rounded-md relative',
  },
})
export class PriceImporterComponent {

  protected importer: ImporterType = 'json'
  protected get isJson() {
    return this.importer === 'json'
  }
  protected get isNWMP() {
    return this.importer === 'nwmp'
  }

  public constructor(private dialog: Dialog) {
    //
  }
  protected select(value: ImporterType) {
    this.importer = value
  }

  protected close() {
    this.dialog.closeAll()
  }
}
