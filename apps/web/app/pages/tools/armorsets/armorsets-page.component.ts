import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, TrackByFunction, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataViewAdapter, DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule, TableGridAdapter } from '~/ui/data/table-grid'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { Armorset } from '~/widgets/data/armorset'
import { ArmorsetGridSource } from '~/widgets/data/armorset/grid'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-armorsets-page',
  templateUrl: './armorsets-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    ScreenshotModule,
    IonicModule,
    TooltipModule,
    DataViewModule,
    DataGridModule,
    ItemDetailModule,
  ],
  host: {
    class: 'layout-col',
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
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public trackByIndex: TrackByFunction<any> = (i) => i
  public constructor(head: HtmlHeadService, protected service: DataViewService<Armorset>) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Armorsets DB',
    })
  }
}
