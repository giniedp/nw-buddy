import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
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
import {
  HtmlHeadService,
  eqCaseInsensitive,
  injectBreakpoint,
  injectChildRouteParam,
  injectRouteParam,
  selectSignal,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { TransmogItem } from '~/widgets/data/transmog'
import { TransmogRecord, TransmogTableAdapter, provideTransmogCellOptions } from '~/widgets/data/transmog-table'

@Component({
  templateUrl: './transmog-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IconsModule,
    ItemFrameModule,
    LayoutModule,
    NwModule,
    PaginationModule,
    QuicksearchModule,
    RouterModule,
    TooltipModule,
    VirtualGridModule,
  ],
  providers: [
    provideTransmogCellOptions({
      navigate: true,
      tooltips: true,
    }),
    provideDataView({
      adapter: TransmogTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  host: {
    class: 'ion-page',
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
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'transmog-table'
  protected categoryParam = 'c'
  protected category = selectSignal(injectRouteParam(this.categoryParam), (it) => it || null)

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  public constructor(
    head: HtmlHeadService,
    protected service: DataViewService<TransmogRecord>,
  ) {
    super({ hoverItem: null })

    service.patchState({ mode: 'grid', modes: ['grid'] })
    head.updateMetadata({
      title: 'Transmog',
      description: 'New World transmog database',
      noFollow: true,
      noIndex: true,
    })
  }
}
