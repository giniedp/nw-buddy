import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PaginationModule } from '~/ui/pagination'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { TransmogRecord, TransmogTableAdapter } from '~/widgets/data/transmog-table'
import { TransmogItem } from '~/widgets/data/transmog'

@Component({
  standalone: true,
  templateUrl: './transmog-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    PaginationModule,
    ItemFrameModule,
    IconsModule,
    TooltipModule,
    DataViewModule,
    VirtualGridModule,
    DataGridModule,
    LayoutModule,
    QuicksearchModule,
  ],
  providers: [
    provideDataView({
      adapter: TransmogTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  host: {
    class: 'layout-col',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(1, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-1rem)' }),
        animate('0.15s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class TransmogPageComponent extends ComponentStore<{ hoverItem: TransmogItem }> {
  protected title = 'Transmog'
  protected defaultRoute = 'table'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'transmog-table'
  protected categoryParam$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  public constructor(head: HtmlHeadService, protected viewService: DataViewService<TransmogRecord>) {
    super({ hoverItem: null })
    viewService.patchState({ mode: 'grid', modes: ['grid'] })
    head.updateMetadata({
      title: 'Transmog',
      description: 'New World transmog database',
      noFollow: true,
      noIndex: true,
    })
  }
}
