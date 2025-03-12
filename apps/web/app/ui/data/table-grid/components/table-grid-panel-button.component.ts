import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core'
import { TableGridPanelComponent } from './table-grid-panel.component'

import { toSignal } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { AgGrid } from '~/ui/data/ag-grid'
import { gridHasAnyFilterPresent } from '~/ui/data/ag-grid/utils'
import { IconsModule } from '~/ui/icons'
import { svgFilter, svgTableCells } from '~/ui/icons/svg'

@Component({
  selector: 'nwb-table-grid-panel-button,button[nwbGridPanelButton]]',
  templateUrl: './table-grid-panel-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule, IconsModule, TableGridPanelComponent],
  hostDirectives: [CdkOverlayOrigin],
  host: {
    class: '',
  },
})
export class DataGridPanelButtonComponent extends ComponentStore<{
  grid: AgGrid
}> {
  @Input()
  public set nwbGridPanelButton(value: AgGrid) {
    this.patchState({ grid: value })
  }

  @Input()
  public set grid(value: AgGrid) {
    this.patchState({ grid: value })
  }

  protected grid$ = this.select(({ grid }) => grid)

  @Input()
  public readonly nwbDataGridPanelButton: void

  protected isPanelOpen = false
  protected isFilterActive$ = toSignal(gridHasAnyFilterPresent(this.grid$), {
    initialValue: false,
  })
  protected svgFilter = svgFilter
  protected svgTable = svgTableCells

  public constructor(protected cdkOrigin: CdkOverlayOrigin) {
    super({ grid: null })
  }
  @HostListener('click')
  public open() {
    this.isPanelOpen = true
  }
}
