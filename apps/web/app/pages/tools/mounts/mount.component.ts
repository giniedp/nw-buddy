import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { combineLatest, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam } from '~/utils'
import { TransmogItem } from '~/widgets/data/appearance-detail'
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
export class MountComponent {
  private readonly mounts$ = inject(NwDbService).mounts
  private readonly categoryId$ = observeRouteParam(inject(ActivatedRoute), 'category')
  protected readonly data$ = combineLatest({
    mounts: this.mounts$,
    category: this.categoryId$,
  }).pipe(
    map(({ mounts, category }) => {
      if (!category || eqCaseInsensitive(category, 'all')) {
        return mounts
      }
      return mounts.filter((it) => eqCaseInsensitive(it.MountType, category))
    })
  )

  protected trackByIndex = (index: number) => index

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Mounts',
      description: 'New World mounts overview',
      noFollow: true,
      noIndex: true,
    })
  }

  protected onClick(item: TransmogItem) {
    console.log(item)
  }
}
