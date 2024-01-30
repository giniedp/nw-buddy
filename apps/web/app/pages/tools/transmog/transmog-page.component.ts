import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
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
import { HtmlHeadService, eqCaseInsensitive, injectBreakpoint, injectRouteParam, injectUrlParams, observeRouteParam, selectSignal, selectStream } from '~/utils'
import { TransmogRecord, TransmogTableAdapter } from '~/widgets/data/transmog-table'
import { TransmogItem } from '~/widgets/data/transmog'
import { uniq } from 'lodash'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  standalone: true,
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
  protected category = selectSignal(injectRouteParam('category'), (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  protected isLargeContent = toSignal(injectBreakpoint('(min-width: 992px)'))
  protected isChildActive = toSignal(injectUrlParams('/:resource/:category/:id', (it) => !!it?.['id']))
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  public constructor(head: HtmlHeadService, protected service: DataViewService<TransmogRecord>) {
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
