import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { Component, HostListener, Input, TemplateRef } from '@angular/core'
import { IconsModule } from '../../icons'
import { svgEllipsisVertical } from '../../icons/svg'
import { TableGridPanelComponent } from '../table-grid'
import { DataViewService } from './data-view.service'
import { gridHasAnyFilterPresent } from '../ag-grid/utils'

@Component({
  standalone: true,
  selector: 'nwb-data-view-options-menu,[nwbDataViewOptionsMenu]',
  templateUrl: './data-view-options-menu.component.html',
  imports: [CommonModule, IconsModule, OverlayModule, TableGridPanelComponent],
  hostDirectives: [CdkOverlayOrigin],
})
export class DataViewOptionsMenuComponent {
  @Input()
  public nwbDataViewOptionsMenu: TemplateRef<unknown>

  protected isPanelOpen = false
  protected icon = svgEllipsisVertical
  protected showIndicator$ = gridHasAnyFilterPresent(this.service.agGrid$)
  public constructor(protected cdkOrigin: CdkOverlayOrigin, protected service: DataViewService<unknown>) {
    //
  }

  @HostListener('click')
  public onClick() {
    this.isPanelOpen = true
  }
}
