import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { DataGridModule, DataGridSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { QuestGridSource } from '~/widgets/data/quest-grid/quest-grid-source'

@Component({
  standalone: true,
  selector: 'nwb-quests-page',
  templateUrl: './quests-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataGridModule, NavbarModule, IonicModule],
  host: {
    class: 'layout-col',
  },
  providers: [
    DataGridSource.provide({
      source: QuestGridSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    NwExpressionContextService,
  ],
})
export class QuestsPageComponent {
  protected title = 'Quests'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'quests-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Quests DB',
    })
  }
}
