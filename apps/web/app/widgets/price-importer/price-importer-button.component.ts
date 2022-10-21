import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, HostListener, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { PriceImporterComponent } from './price-importer.component'

@Component({
  standalone: true,
  selector: 'nwb-price-importer-button',
  templateUrl: './price-importer-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DialogModule, PriceImporterComponent],
  host: {
    class: 'layout-content',
  },
})
export class PriceImporterButtonComponent {
  @Input()
  public icon: boolean = true

  public constructor(private dialog: Dialog) {
    //
  }


  @HostListener('click')
  public openImporter() {
    this.dialog.closeAll()
    this.dialog.open(PriceImporterComponent, {
      minHeight: 600,
      maxHeight: '90vh',
      minWidth: 320,
      maxWidth: 800,
      width: '100vw',
      height: '100vh',
      panelClass: ['layout-col', 'layout-pad'],
    })
  }
}
