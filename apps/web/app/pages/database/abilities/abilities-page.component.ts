import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { AbilityTableAdapter } from '~/widgets/data/ability-table'
import { ItemTableAdapter, ItemTableRecord } from '~/widgets/data/item-table'
import { ScreenshotModule } from '~/widgets/screenshot'
import { svgFunction } from '~/ui/icons/svg'

@Component({
  standalone: true,
  selector: 'nwb-abilities-page',
  templateUrl: './abilities-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IonicModule,
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
      adapter: AbilityTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class AbilitiesPageComponent {
  protected title = 'Abilities'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'abilities-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })
  protected iconFunc = svgFunction
  protected isFuncOpen = false

  public constructor(
    protected service: DataViewService<ItemTableRecord>,
    protected search: QuicksearchService,
    head: HtmlHeadService
  ) {
    service.patchState({ mode: 'table' })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Abilities DB',
    })
  }
}
