import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgFunction } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectBreakpoint, injectChildRouteParam, injectRouteParam, selectSignal } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemTableRecord } from '~/widgets/data/item-table'
import { WeaponDefinitionTableAdapter } from '~/widgets/data/weapon-definitions-table'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SplitGutterComponent, SplitPaneDirective } from '../../../ui/split-container'

@Component({
  selector: 'nwb-weapon-definitions-page',
  templateUrl: './weapon-definitions-page.component.html',
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
    SplitPaneDirective,
    SplitGutterComponent
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: WeaponDefinitionTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class WeaponDefinitionsPageComponent {
  protected title = 'Weapon Definitions'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'weapon-definitions-table'
  protected categoryParam = 'c'
  protected category = selectSignal(injectRouteParam(this.categoryParam), (it) => it || null)

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  protected iconFunc = svgFunction
  protected isFuncOpen = false

  public constructor(
    protected service: DataViewService<ItemTableRecord>,
    protected search: QuicksearchService,
    head: HtmlHeadService,
  ) {
    service.setModes(['table'])
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Weapon Definitions DB',
    })
  }
}
