import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataGridModule, DataGridSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { LootTableGridSource } from '~/widgets/data/loot-table-grid/loot-table-grid-source'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-loot-page',
  templateUrl: './loot-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    FormsModule,
    IonicModule,
    LootModule,
    NavbarModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    TooltipModule,
  ],
  providers: [
    DataGridSource.provide({
      source: LootTableGridSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  host: {
    class: 'layout-col',
  },
})
export class LootPageComponent {
  protected title = 'Loot Tables'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'loot-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Loot Tables DB',
    })
  }
}
