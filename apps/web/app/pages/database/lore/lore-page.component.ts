import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
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
import { LoreItemTableAdapter } from '~/widgets/data/lore-table'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-lore-page',
  templateUrl: './lore-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IconsModule,
    IonHeader,
    LayoutModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: LoreItemTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class LorePageComponent {
  protected title = 'Lore Items'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'lore-table'
  protected categoryParam = 'c'
  protected category = selectSignal(injectRouteParam(this.categoryParam), (it) => it || null)

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
    service.setModes(['grid', 'table'])
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Lore DB',
    })
  }
}
