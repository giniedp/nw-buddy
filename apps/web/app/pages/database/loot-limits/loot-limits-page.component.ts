import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, injectRouteParam, selectSignal } from '~/utils'
import { ItemTableRecord } from '~/widgets/data/item-table'
import { LootLimitTableAdapter } from '~/widgets/data/loot-limit-table'

@Component({
  standalone: true,
  selector: 'nwb-loot-limits-page',
  templateUrl: './loot-limits-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataGridModule, DataViewModule, IonHeader, QuicksearchModule, RouterModule, VirtualGridModule],
  host: {
    class: 'layout-col',
  },
  providers: [
    provideDataView({
      adapter: LootLimitTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class LootLimitsPageComponent {
  protected title = 'Loot Limits'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'loot-limits-table'
  protected category = selectSignal(injectRouteParam('category'), (it) => {
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
      title: 'New World - Loot Limits DB',
    })
  }
}
