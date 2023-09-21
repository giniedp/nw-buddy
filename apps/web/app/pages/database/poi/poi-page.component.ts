import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataGridModule, DataTableSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { PoiTableSource } from '~/widgets/data/poi-table'

@Component({
  standalone: true,
  selector: 'nwb-poi-page',
  templateUrl: './poi-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, NavbarModule, IonicModule, DataGridModule],
  host: {
    class: 'layout-col',
  },
  providers: [
    DataTableSource.provide({
      type: PoiTableSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class PoiPageComponent {
  protected title = 'Points of Interest'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'poi-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })
  protected isToolOpen = false

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Points Of Interes DB',
    })
  }
}
