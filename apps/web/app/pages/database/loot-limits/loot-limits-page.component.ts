import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  injectBreakpoint,
  injectChildRouteParam,
  injectRouteParam,
  selectSignal,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemTableRecord } from '~/widgets/data/item-table'
import { LootLimitTableAdapter } from '~/widgets/data/loot-limit-table'

@Component({
  standalone: true,
  selector: 'nwb-loot-limits-page',
  templateUrl: './loot-limits-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IonHeader,
    QuicksearchModule,
    RouterModule,
    LayoutModule,
    VirtualGridModule,
  ],
  host: {
    class: 'ion-page',
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

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

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
