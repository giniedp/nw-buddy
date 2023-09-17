import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataGridModule, DataGridSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { StatusEffectGridSource } from '~/widgets/data/status-effect-grid/status-effect-grid-source'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-status-effects-page',
  templateUrl: './status-effects-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonicModule,
    NavbarModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    DataGridModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    DataGridSource.provide({
      source: StatusEffectGridSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class StatusEffectsPageComponent {
  protected title = 'Status Effects'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'status-effect-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Status Effects DB',
    })
  }
}
