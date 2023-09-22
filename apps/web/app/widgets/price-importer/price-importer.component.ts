import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgXmark } from '~/ui/icons/svg'
import { JsonPriceImporterComponent } from './json'
import { NwmpPriceImporterComponent } from './nwmp/price-importer-nwmp.component'

type ImporterType = 'json' | 'nwmp'

@Component({
  standalone: true,
  selector: 'nwb-price-importer',
  templateUrl: './price-importer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, DialogModule, JsonPriceImporterComponent, NwmpPriceImporterComponent],
  host: {
    class: 'layout-col bg-base-300 rounded-md relative',
  },
})
export class PriceImporterComponent {
  protected iconClose = svgXmark
  protected importer: ImporterType = 'nwmp'
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
