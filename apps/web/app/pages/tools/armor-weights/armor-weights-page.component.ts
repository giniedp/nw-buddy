import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject, TrackByFunction } from '@angular/core'
import { EquipSlotId } from '@nw-data/common'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { ArmorWeightSet, ArmorWeightsStore } from './armor-weights.store'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { ArmorWeightTableAdapter } from './armor-weight-adapter'
import { HtmlHeadService, eqCaseInsensitive, humanize, injectRouteParam, observeRouteParam, selectSignal, selectStream } from '~/utils'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { DataGridModule } from '~/ui/data/table-grid'
import { LayoutModule } from '~/ui/layout'


@Component({
  standalone: true,
  selector: 'nwb-armor-weights-page',
  templateUrl: './armor-weights-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, NwModule,

    RouterModule,
    LayoutModule,
    DataViewModule,
    DataGridModule,
  ],
  providers: [
    ArmorWeightsStore,
    provideDataView({
      adapter: ArmorWeightTableAdapter
      ,
    }),
  ],
  host: {
    class: 'ion-page'
  },
})
export class ArmorWeightsPageComponent {

  protected title = 'Armor Weights'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'armorweights-table'
  protected category = selectSignal(injectRouteParam('category'), (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(head: HtmlHeadService, protected service: DataViewService<ArmorWeightSet>) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Armor Weights DB',
    })
  }
}
