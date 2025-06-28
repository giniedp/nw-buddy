import { GridOptions } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Router, RouterModule } from '@angular/router'
import { VitalsData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataGridModule, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectChildRouteParam, injectRouteParam } from '~/utils'
import { VitalGridCellComponent, vitalColIcon, vitalColLevel, vitalColName } from '~/widgets/data/vital-table'
import { ZoneDetailModule } from '~/widgets/data/zone-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
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
  ],
  providers: [],
  host: {
    class: 'ion-page',
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
      vitalColName(this.gridUtils, { link: true }),
      vitalColLevel(this.gridUtils),
    ],
  }

  protected virtualGridOptions = VitalGridCellComponent.buildGridOptions()

  protected vitalIdFn = (it: VitalsData) => it?.VitalsID?.toLowerCase()

  protected onVitalClicked(vital: VitalsData | string | number) {
    if (typeof vital === 'number') {
      vital = vital.toString()
    }
    if (typeof vital !== 'string') {
      vital = this.vitalIdFn(vital)
    }
    // this.router.navigate(['/zones', this.itemId(), vital || ''])
  }
}
