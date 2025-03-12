import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  injectBreakpoint,
  injectRouteParam,
  injectUrlParams,
  observeRouteParam,
  selectSignal,
  selectStream,
} from '~/utils'
import { Armorset } from '~/widgets/data/armorset'
import { ArmorsetGridSource } from '~/widgets/data/armorset/grid'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-armorsets-page',
  templateUrl: './armorsets-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    LayoutModule,
    NwModule,
    QuicksearchModule,
    ScreenshotModule,
    IonHeader,
    TooltipModule,
    DataViewModule,
    DataGridModule,
    ItemDetailModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: ArmorsetGridSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class ArmorsetsPageComponent {
  protected title = 'Armorsets'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'armorsets-table'
  protected category = selectSignal(injectRouteParam('category'), (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  protected isLargeContent = toSignal(injectBreakpoint('(min-width: 992px)'))
  protected isChildActive = toSignal(injectUrlParams('/:resource/:category/:id', (it) => !!it?.['id']))
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  public constructor(
    head: HtmlHeadService,
    protected service: DataViewService<Armorset>,
  ) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Armorsets DB',
    })
  }
}
