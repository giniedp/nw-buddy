import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core'

import { ComponentStore } from '@ngrx/component-store'
import { AgGrid } from '~/ui/data/ag-grid'
import { IconsModule } from '~/ui/icons'
import { svgFunction } from '~/ui/icons/svg'
import { TableGridExpressionPanelComponent } from './table-grid-expression-panel.component'

@Component({
  selector: 'nwb-table-grid-expression-button,button[nwbTableExpressionButton]]',
  templateUrl: './table-grid-expression-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule, IconsModule, TableGridExpressionPanelComponent],
  hostDirectives: [CdkOverlayOrigin],
  host: {
    class: '',
  },
})
export class TableGridExpressionButtonComponent extends ComponentStore<{
  grid: AgGrid
}> {
  @Input()
  public set nwbTableExpressionButton(value: AgGrid) {
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
  protected icon = svgFunction

  public constructor(protected cdkOrigin: CdkOverlayOrigin) {
    super({ grid: null })
  }

  @HostListener('click')
  public open() {
    this.isPanelOpen = true
  }
}
