import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { getVitalFamilyInfo } from '@nw-data/common'
import { Vitals } from '@nw-data/generated'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'

import { toSignal } from '@angular/core/rxjs-interop'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgPen } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, observeQueryParam, observeRouteParam, selectStream } from '~/utils'
import { VitalDetailModule } from '~/widgets/data/vital-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'
import { ModelViewerModule } from '../../../widgets/model-viewer'

export type DetailTabId = 'stats' | 'loot-items' | 'loot-table' | 'damage-table' | '3d-model'

@Component({
  standalone: true,
  templateUrl: './vital-detail-page.component.html',
  styleUrls: ['./vital-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    //VitalsDetailModule,
    VitalDetailModule,
    LootModule,
    LayoutModule,
    ScreenshotModule,
    ModelViewerModule,
    TooltipModule,
    IconsModule,
  ],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class VitalDetailComponent {
  protected vitalId$ = observeRouteParam(this.route, 'id')
  protected vitalId = toSignal(this.vitalId$)

  protected tabId$ = observeQueryParam(this.route, 'tab').pipe(map((it: DetailTabId): DetailTabId => it || 'stats'))
  protected tab = toSignal(this.tabId$)

  protected iconEdit = svgPen

  protected vital$ = selectStream(this.db.vital(this.vitalId$), (it) => {
    this.onEntity(it)
    return it
  })

  protected lootTableId$ = selectStream(this.vital$, (it) => it.LootTableId)

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private db: NwDbService,
    private i18n: TranslateService,
    private head: HtmlHeadService,
  ) {
    //
  }

  public openTab(tab: DetailTabId) {
    this.router.navigate([], {
      queryParams: {
        tab: tab,
      },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }

  protected async onEntity(entity: Vitals) {
    if (!entity) {
      return
    }
    const info = getVitalFamilyInfo(entity)
    this.head.updateMetadata({
      title: [this.i18n.get(entity.DisplayName), 'Creature'].join(' - '),
      description: [this.i18n.get(info?.Name), `Level: ${entity.Level}`].join(' - '),
      url: this.head.currentUrl,
      image: info?.Icon,
    })
  }
}
