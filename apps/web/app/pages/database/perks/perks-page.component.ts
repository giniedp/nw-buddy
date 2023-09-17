import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { firstValueFrom } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { DataGridModule, DataGridSource } from '~/ui/data-grid'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { PerkGridSource } from '~/widgets/data/perk-grid/perk-grid-source'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-perks-page',
  templateUrl: './perks-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NavbarModule,
    NwModule,
    OverlayModule,
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
      source: PerkGridSource,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    NwExpressionContextService,
  ],
})
export class PerksPageComponent {
  protected title = 'Perks'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'perks-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })
  protected isToolOpen = false

  public constructor(
    public search: QuicksearchService,
    public ctx: NwExpressionContextService,
    head: HtmlHeadService,
    char: CharacterStore
  ) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Perks DB',
    })
    firstValueFrom(char.level$).then((value) => {
      ctx.level = value
    })
  }
}
