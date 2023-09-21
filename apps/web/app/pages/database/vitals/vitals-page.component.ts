import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataGridModule, DataTableSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { VitalTableSource } from '~/widgets/data/vital-table'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-vitals-page',
  templateUrl: './vitals-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    DataGridModule,
    QuicksearchModule,
    NavbarModule,
    IonicModule,
    ScreenshotModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    DataTableSource.provide({
      type: VitalTableSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class VitalsPageComponent {
  protected title = 'Vitals'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'vitals-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Vitals & Creatures DB',
    })
  }
}
