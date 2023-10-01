import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, HostListener, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { PriceImporterComponent } from './price-importer.component'
import { svgSackDollar } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-price-importer-button,[nwbPriceImporterButton]',
  templateUrl: './price-importer-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, IconsModule, PriceImporterComponent],
  host: {
    class: 'layout-content',
  },
})
export class PriceImporterButtonComponent {
  @Input()
  public nwbPriceImporterButton: void
  @Input()
  public icon: string | false = svgSackDollar

  public constructor(private dialog: Dialog) {
    //
  }

  @HostListener('click')
  public openImporter() {
    this.dialog.open(PriceImporterComponent, {
      minHeight: 400,
      maxHeight: '90vh',
      minWidth: 320,
      maxWidth: 800,
      panelClass: ['w-full', 'layout-pad', 'shadow'],
    })
  }
}
