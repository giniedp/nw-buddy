import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { ItemTableRecord } from '~/widgets/data/item-table'
import { PvpRankTableAdapter } from '~/widgets/data/pvp-rank-table'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-pvp-ranks-page',
  templateUrl: './pvp-ranks-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IonHeader,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
    IconsModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    provideDataView({
      adapter: PvpRankTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class PvpRanksPageComponent {
  protected title = 'Pvp Ranks'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'pvp-ranks-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(
    protected service: DataViewService<ItemTableRecord>,
    protected search: QuicksearchService,
    head: HtmlHeadService,
  ) {
    service.patchState({ mode: 'table', modes: ['table'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Pvp Ranks DB',
    })
  }
}
