import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgFunction } from '~/ui/icons/svg'
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
import { SeasonPassTableAdapter } from '~/widgets/data/season-pass-table'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-season-pass-page',
  templateUrl: './season-pass-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IonHeader,
    LayoutModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
    IconsModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: SeasonPassTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class SeasonPassPageComponent {
  private db = injectNwData()
  protected seasonIdsResource = resource({ loader: () => this.db.seasonIds(null) })
  protected seasonIds = computed(() =>
    this.seasonIdsResource.hasValue() ? this.seasonIdsResource.value().reverse() : [],
  )
  protected title = 'Season Pass'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'season-pass-table'
  protected categoryParam = 'c'
  protected categoryParamValue = toSignal(injectRouteParam(this.categoryParam))
  protected category = computed(() => {
    return this.categoryParamValue() || this.seasonIds()[0]
  })

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
    service.patchState({ mode: 'table', modes: ['table'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Season Pass DB',
    })
  }
}
