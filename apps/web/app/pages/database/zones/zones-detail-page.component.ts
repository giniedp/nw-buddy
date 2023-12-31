import { GridOptions } from '@ag-grid-community/core'
import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { DataGridModule, TableGridUtils } from '~/ui/data/table-grid'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectRouteParam, observeRouteParam } from '~/utils'
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
    DataGridModule
  ],
  providers: [],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class ZoneDetailPageComponent {
  protected itemId = toSignal(injectRouteParam('id'))

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
    ]
  }

  public constructor(
    private route: ActivatedRoute,
    private dialog: Dialog,
    private head: HtmlHeadService,
    private i18n: TranslateService,
  ) {
    //
  }

  // protected onEntity(entity: ItemDefinitionMaster) {
  //   if (!entity) {
  //     return
  //   }
  //   this.head.updateMetadata({
  //     title: this.i18n.get(entity.Name),
  //     description: this.i18n.get(entity.Description),
  //     url: this.head.currentUrl,
  //     image: `${this.head.origin}/${getItemIconPath(entity)}`,
  //   })
  // }
}
