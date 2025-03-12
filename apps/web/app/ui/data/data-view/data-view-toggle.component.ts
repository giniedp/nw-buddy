import { Component, HostListener, Input, computed } from '@angular/core'
import { IconsModule } from '../../icons'
import { svgGrid, svgTableList } from '../../icons/svg'
import { DataViewMode, DataViewService } from './data-view.service'
import { CommonModule } from '@angular/common'
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'

@Component({
  selector: 'nwb-data-view-toggle,[nwbDataViewToggle]',
  templateUrl: './data-view-toggle.component.html',
  imports: [CommonModule, IconsModule, OverlayModule],
  hostDirectives: [CdkOverlayOrigin],
  host: {
    '[data-testid]': 'nwbDataViewToggle',
  },
})
export class DataViewToggleComponent {
  @Input()
  public nwbDataViewToggle: void

  protected isPanelOpen = false
  protected iconGrid = svgGrid
  protected iconTable = svgTableList

  protected icon$ = computed(() => {
    return this.service.isTableActive() ? svgTableList : svgGrid
  })

  public constructor(
    protected cdkOrigin: CdkOverlayOrigin,
    protected service: DataViewService<unknown>,
  ) {
    //
  }

  @HostListener('click')
  public onClick() {
    this.isPanelOpen = true
  }

  protected activateGrid() {
    this.isPanelOpen = false
    this.service.patchState({ mode: 'grid' })
  }

  protected activateTable() {
    this.isPanelOpen = false
    this.service.patchState({ mode: 'table' })
  }
}
