import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'
import {
  HtmlHeadService,
  eqCaseInsensitive,
  injectBreakpoint,
  injectChildRouteParam,
  injectRouteParam,
  selectSignal,
  selectStream,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { MountTileComponent } from './mount-tile.component'

@Component({
  standalone: true,
  templateUrl: './mount.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    LayoutModule,
    PaginationModule,
    ItemFrameModule,
    IconsModule,
    TooltipModule,
    MountTileComponent,
  ],
  host: {
    class: 'ion-page',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(5, animateChild()), {
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
export class MountComponent {
  private readonly mounts$ = inject(NwDataService).mounts.pipe(map((list) => list.filter((it) => !!it.DisplayName)))
  private readonly categoryId$ = injectRouteParam('c')
  protected readonly data$ = selectStream(
    {
      mounts: this.mounts$,
      category: this.categoryId$,
    },
    ({ mounts, category }) => {
      if (!category) {
        return mounts
      }
      return mounts.filter((it) => eqCaseInsensitive(it.MountType, category))
    },
  )
  protected readonly count$ = selectStream(this.data$, (it) => it?.length)

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Mounts',
      description: 'New World mounts overview',
      noFollow: true,
      noIndex: true,
    })
  }
}
