import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, debounce, debounceTime, defer, map, startWith, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ItemPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgRepeat } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PaginationModule } from '~/ui/pagination'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ContentVisibilityDirective, HtmlHeadService, mapFilter, shareReplayRefCount } from '~/utils'
import { IntersectionObserverModule } from '~/utils/intersection-observer'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { ScreenshotModule } from '~/widgets/screenshot'

function isMusicSheet(item: ItemDefinitionMaster) {
  return item.TradingFamily === 'MusicSheets'
}

@Component({
  standalone: true,
  selector: 'nwb-music-sheets-overview',
  templateUrl: './music-sheets.component.html',
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
    QuicksearchModule,
    PaginationModule
  ],
  host: {
    class: 'layout-col',
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
export class MusicSheetsOverviewComponent {
  protected iconFlip = svgRepeat
  protected source$ = this.db.items.pipe(mapFilter((it) => isMusicSheet(it))).pipe(shareReplayRefCount(1))
  protected items$ = combineLatest({
    items: this.source$,
    search: this.search.query.pipe(debounceTime(300), startWith('')),
    locale: this.i18n.locale.value$,
  }).pipe(
    map(({ items, search }) => {
      if (!search) {
        return items
      }
      search = search.toLowerCase()
      return items.filter((it) => {
        return this.i18n.get(it.Name)?.toLocaleLowerCase()?.includes(search)
      })
    })
  )
  protected stats$ = this.source$.pipe(switchMap((list) => {
    return combineLatest(list.map((it) => this.itemPref.observe(it.ItemID)))
  }))
  .pipe(map((list) => {
    const total = list.length
    const learned = list.filter((it) => !!it.meta?.mark).length
    return {
      total: total,
      learned: learned,
      percent: learned / total
    }
  }))
  protected trackByFn: TrackByFunction<ItemDefinitionMaster> = (i, item) => getItemId(item)

  public constructor(
    private db: NwDbService,
    private search: QuicksearchService,
    private i18n: TranslateService,
    private itemPref: ItemPreferencesService,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      title: 'Music Sheets',
      description: 'Overview of all collectable music sheets in New World.',
    })
  }
}
