import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, HostListener } from '@angular/core'
import { DataTablePanelComponent } from './data-table-panel.component'

@Component({
  standalone: true,
  selector: 'nwb-data-table-panel-button',
  templateUrl: './data-table-panel-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule, DataTablePanelComponent],
  host: {
    class: '',
  },
})
export class DataTablePanelButtonComponent extends CdkOverlayOrigin {
  protected isPanelOpen = false
  protected get cdkOrigin() {
    return this
  }
  public constructor(elementRef: ElementRef) {
    super(elementRef)
  }
  @HostListener('click')
  public open() {
    this.isPanelOpen = true
  }
}
