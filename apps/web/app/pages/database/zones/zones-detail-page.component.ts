import { GridOptions } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataGridModule, TableGridUtils } from '~/ui/data/table-grid'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectRouteParam } from '~/utils'
import { VitalGridCellComponent, vitalColIcon, vitalColLevel, vitalColName } from '~/widgets/data/vital-table'
import { ZoneDetailModule } from '~/widgets/data/zone-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-zones-detail-page',
  template: `
    @if (zoneIdParam()) {
      <nwb-zone-detail class="flex-none bg-black/75" [zoneId]="zoneIdParam()" #detail />
    }
  `,
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
    class: 'block',
  },
})
export class ZoneDetailPageComponent {
  protected idParam = toSignal(injectRouteParam('id'))
  protected zoneIdParam = computed(() => {
    const id = this.idParam()
    return isZoneId(id) ? id : null
  })
  protected mapIdParam = computed(() => {
    const id = this.idParam()
    return isZoneId(id) ? null : id
  })

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
}

function isZoneId(id: string) {
  return id && id.match(/^\d+$/)
}
