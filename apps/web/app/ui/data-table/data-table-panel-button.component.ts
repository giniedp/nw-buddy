import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, HostListener } from '@angular/core'
import { DataTablePanelComponent } from './data-table-panel.component'
import { DataTableAdapter } from '~/ui/data-table/data-table-adapter'
import { svgFilter, svgTableCells } from '../icons/svg'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-data-table-panel-button',
  templateUrl: './data-table-panel-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule, IconsModule, DataTablePanelComponent],
  host: {
    class: '',
  },
})
export class DataTablePanelButtonComponent extends CdkOverlayOrigin {
  protected isPanelOpen = false
  protected isFilterActive = this.adapter.isAnyFilterPresent$
  protected svgFilter = svgFilter
  protected svgTable = svgTableCells
  protected get cdkOrigin() {
    return this
  }
  public constructor(elementRef: ElementRef, private adapter: DataTableAdapter<any>) {
    super(elementRef)
  }
  @HostListener('click')
  public open() {
    this.isPanelOpen = true
  }
}
