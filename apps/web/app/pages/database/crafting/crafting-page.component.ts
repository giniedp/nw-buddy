import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataGridModule, DataTableSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { CraftingTableSource } from '~/widgets/data/crafting-table'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-crafting-page',
  templateUrl: './crafting-page.component.html',
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    NavbarModule,
    ScreenshotModule,
    IonicModule,
    PriceImporterModule,
    TooltipModule,
    DataGridModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    DataTableSource.provide({
      type: CraftingTableSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class CraftingPageComponent {
  protected title = 'Crafting'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'crafting-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Crafting Recipes DB',
    })
  }
}
