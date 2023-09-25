import { animate, animateChild, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { Crafting, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, debounceTime, defer, map, startWith, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getIngretientsFromRecipe, getItemIdFromRecipe, isItemArtifact } from '@nw-data/common'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgRepeat } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ContentVisibilityDirective, HtmlHeadService } from '~/utils'
import { IntersectionObserverModule } from '~/utils/intersection-observer'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { ScreenshotModule } from '~/widgets/screenshot'


@Component({
  standalone: true,
  selector: 'nwb-artifacts-overview',
  templateUrl: './artifacts-overview.component.html',
  //styleUrls: ['./artifacts-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemDetailModule,
    ScreenshotModule,
    IntersectionObserverModule,
    ContentVisibilityDirective,
    ItemTrackerModule,
    ItemFrameModule,
    IconsModule,
    PaginationModule,
  ],
  host: {
    class: 'flex flex-col flex-1 overflow-auto',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(25, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-1rem)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ArtifactsOverviewComponent {
  protected iconFlip = svgRepeat
  protected items$ = this.db.items.pipe(map((list) => list.filter(isItemArtifact)))
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(
    private db: NwDbService,
    private search: QuicksearchService,
    private i18n: TranslateService,
    private itemPref: ItemPreferencesService,
    head: HtmlHeadService
  ) {
    head.updateMetadata({
      title: 'Artifact Items',
      description: 'Overview of all artifact items in New World',
    })
  }
}
