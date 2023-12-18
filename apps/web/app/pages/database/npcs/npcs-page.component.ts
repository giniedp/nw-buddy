import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
import { GatherableTableAdapter, GatherableTableRecord } from '~/widgets/data/gatherable-table'
import { NpcTableRecord, NpcsTableAdapter } from '~/widgets/data/npc-table'

@Component({
  standalone: true,
  selector: 'nwb-npcs-page',
  templateUrl: './npcs-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IconsModule,
    IonHeader,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
    PriceImporterModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    provideDataView({
      adapter: NpcsTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class NpcsPageComponent {
  protected title = 'Npcs'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'npcs-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(
    protected service: DataViewService<NpcTableRecord>,
    protected search: QuicksearchService,
    head: HtmlHeadService
  ) {
    service.patchState({ mode: 'grid', modes: ['grid'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - NPCs DB',
    })
  }
}
