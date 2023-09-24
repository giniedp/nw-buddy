import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { firstValueFrom, map } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewAdapter, DataViewModule, provideDataView } from '~/ui/data/data-view'
import { DataViewService } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgFunction, svgGrid, svgTableList } from '~/ui/icons/svg'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { PerkTableRecord, PerkTableAdapter } from '~/widgets/data/perk-table'
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
    IconsModule,
    TooltipModule,
    VirtualGridModule,
    DataViewModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    provideDataView({
      adapter: PerkTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    NwTextContextService,
  ],
})
export class PerksPageComponent {
  protected title = 'Perks'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'perks-table'
  protected category$ = observeRouteParam(inject(ActivatedRoute), 'category').pipe(
    map((it) => {
      return eqCaseInsensitive(it, this.defaultRoute) ? null : it
    })
  )
  protected isToolOpen = false
  protected iconList = svgTableList
  protected iconGrid = svgGrid
  protected iconFunc = svgFunction
  protected isFuncOpen = false

  public constructor(
    public search: QuicksearchService,
    public ctx: NwTextContextService,
    protected service: DataViewService<PerkTableRecord>,
    head: HtmlHeadService,
    char: CharacterStore
  ) {
    service.patchState({ mode: 'table', modes: ['table'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Perks DB',
    })
    firstValueFrom(char.level$).then((value) => {
      ctx.patchState({ charLevel: value })
    })
  }
  protected toggleMode() {
    // this.virtualModeActive = !this.virtualModeActive
  }
}
