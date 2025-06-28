import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSackDollar } from '~/ui/icons/svg'
import { ModalService } from '~/ui/layout'
import { PriceImporterComponent } from './price-importer.component'

@Component({
  selector: 'nwb-price-importer-button,[nwbPriceImporterButton]',
  templateUrl: './price-importer-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule],
  host: {
    class: 'layout-content',
  },
})
export class PriceImporterButtonComponent {
  @Input()
  public nwbPriceImporterButton: void

  @Input()
  public icon: string | false = svgSackDollar

  public constructor(private modal: ModalService) {
    //
  }

  @HostListener('click')
  public openImporter() {
    this.modal.open({
      content: PriceImporterComponent,
      size: 'md',
    })
  }
}
