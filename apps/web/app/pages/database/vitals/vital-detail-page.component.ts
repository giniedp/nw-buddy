import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { NW_MAX_CHARACTER_LEVEL, getVitalDungeon, getVitalFamilyInfo } from '@nw-data/common'
import { Vitals } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, defer, map, tap } from 'rxjs'
import { TranslateService } from '~/i18n'

import { NwDbService, NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { HtmlHeadService, observeQueryParam, observeRouteParam, selectStream, shareReplayRefCount } from '~/utils'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'
import { VitalsDetailModule } from '~/widgets/vitals-detail'
import { ModelViewerModule, ModelViewerService } from '../../../widgets/model-viewer'
import { TooltipModule } from '~/ui/tooltip'
import { svgPen } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'

export type DetailTabId = 'loot-items' | 'loot-table' | 'damage-table' | '3d-model'

@Component({
  standalone: true,
  templateUrl: './vital-detail-page.component.html',
  styleUrls: ['./vital-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    VitalsDetailModule,
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
  protected modelFiles$ = selectStream(inject(ModelViewerService).byVitalsId(this.vitalId$))
  protected tabId$ = observeQueryParam(this.route, 'tab').pipe(
    map((it: DetailTabId): DetailTabId => it || 'loot-table')
  )

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
    private head: HtmlHeadService
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
