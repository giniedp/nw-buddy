import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam, selectStream } from '~/utils'
import { MountTileComponent } from './mount-tile.component'

@Component({
  standalone: true,
  templateUrl: './mount.component.html',
  styleUrls: ['./mount.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    PaginationModule,
    ItemFrameModule,
    IconsModule,
    TooltipModule,
    MountTileComponent,
  ],
  host: {
    class: 'layout-row',
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
  private readonly categoryId$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected readonly data$ = selectStream(
    {
      mounts: this.mounts$,
      category: this.categoryId$,
    },
    ({ mounts, category }) => {
      if (!category || eqCaseInsensitive(category, 'all')) {
        return mounts
      }
      return mounts.filter((it) => eqCaseInsensitive(it.MountType, category))
    }
  )
  protected readonly count$ = selectStream(this.data$, (it) => it?.length)

  protected trackByIndex = (index: number) => index

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Mounts',
      description: 'New World mounts overview',
      noFollow: true,
      noIndex: true,
    })
  }
}
