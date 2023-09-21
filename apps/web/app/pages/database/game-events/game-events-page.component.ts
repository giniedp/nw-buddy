import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { DataGridModule, DataTableSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { GameEventTableSource } from '~/widgets/data/game-event-table'

@Component({
  standalone: true,
  selector: 'nwb-game-events-page',
  templateUrl: './game-events-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataGridModule, NavbarModule, IonicModule],
  host: {
    class: 'layout-col',
  },
  providers: [
    DataTableSource.provide({
      type: GameEventTableSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    NwTextContextService,
  ],
})
export class GameEventsPageComponent {
  protected title = 'Game Events'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'game-events-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Game Events DB',
    })
  }
}
