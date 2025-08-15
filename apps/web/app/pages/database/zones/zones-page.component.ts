import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgBars } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  injectBreakpoint,
  injectChildRouteParam,
  injectRouteParam,
  injectUrlParams,
  selectSignal,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemTableRecord } from '~/widgets/data/item-table'
import { ZoneDetailModule } from '~/widgets/data/zone-detail'
import { ZoneTableAdapter } from '~/widgets/data/zone-table'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-zones-page',
  templateUrl: './zones-page.component.html',
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
    ZoneDetailModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: ZoneTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class ZonesPageComponent {
  protected title = 'Zones'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'zone-table'
  private urlParams$ = injectUrlParams('/zones/:id')
  protected zoneIdParam = selectSignal(this.urlParams$, (it) => it?.['id'])
  protected categoryParam = 'c'
  protected category = selectSignal(injectRouteParam(this.categoryParam), (it) => it || null)

  protected platform = inject(PlatformService)

  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())
  protected showTable = signal(false)
  protected pinMenu = selectSignal(injectBreakpoint('(min-width: 1920px)'), (ok) => ok || this.platform.isServer)

  protected router = inject(Router)
  protected route = inject(ActivatedRoute)
  protected menuIcon = svgBars

  @ViewChild(RouterOutlet, { static: true })
  protected outlet: RouterOutlet

  public constructor(
    protected service: DataViewService<ItemTableRecord>,
    protected search: QuicksearchService,
    head: HtmlHeadService,
  ) {
    service.patchState({ mode: 'table', modes: ['table'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Territories and POIs DB',
    })
  }

  protected onZoneClicked(zoneId: string) {
    this.router.navigate(['/map', zoneId])
  }

  protected onVitalClicked(vitalId: string) {
    this.router.navigate(['/map', this.zoneIdParam(), vitalId || ''])
  }
}
