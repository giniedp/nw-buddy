import { GridOptions } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Router, RouterModule } from '@angular/router'
import { Vitals } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataGridModule, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectChildRouteParam, injectRouteParam } from '~/utils'
import { vitalColIcon, vitalColLevel, vitalColName } from '~/widgets/data/vital-table'
import { ZoneDetailModule } from '~/widgets/data/zone-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-zones-detail-page',
  templateUrl: './zones-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ScreenshotModule,
    LootModule,
    IconsModule,
    TooltipModule,
    ZoneDetailModule,
    LayoutModule,
    DataGridModule,
    VirtualGridComponent,
  ],
  providers: [],
  host: {
    class: 'block flex flex-col',
  },
})
export class ZoneDetailPageComponent {
  protected itemId = toSignal(injectRouteParam('id'))
  protected vitalId = toSignal(injectChildRouteParam('vitalId'))
  private router = inject(Router)

  protected iconLink = svgSquareArrowUpRight
  protected gridUtils = inject(TableGridUtils)
  protected gridOptions: GridOptions = {
    columnDefs: [
      vitalColIcon(this.gridUtils, { color: true }),
      vitalColName(this.gridUtils),
      vitalColLevel(this.gridUtils),
    ],
  }

  protected vitalIdFn = (it: Vitals) => it?.VitalsID

  protected onVitalClicked(vital: Vitals) {
    this.router.navigate(['/zones/table', this.itemId(), this.vitalIdFn(vital) || ''])
  }
}
