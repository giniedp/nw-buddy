import { GridOptions } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { Vitals } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataGridModule, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectRouteParam } from '~/utils'
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
    class: 'flex-1 flex flex-col',
  },
})
export class ZoneDetailPageComponent {
  protected itemId = toSignal(injectRouteParam('id'))
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  protected iconLink = svgSquareArrowUpRight
  protected gridUtils = inject(TableGridUtils)
  protected gridOptions: GridOptions = {
    columnDefs: [
      vitalColIcon(this.gridUtils),
      vitalColName(this.gridUtils),
      vitalColLevel(this.gridUtils),
      // vitalColFamily(util),
      // vitalColCreatureType(util),
      // vitalColCategories(util),
    ],
  }

  protected vitalIdFn = (it: Vitals) => it?.VitalsID

  protected onVitalClicked(vitalId: string) {

  }

  protected onZoneClicked(zoneId: string) {
    this.router.navigate(['/zones/table', zoneId])
  }
}
