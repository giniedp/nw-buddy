import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, debounce, debounceTime, defer, map, startWith } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { getItemId } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgRepeat } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ContentVisibilityDirective, HtmlHeadService, mapFilter } from '~/utils'
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
  ],
  host: {
    class: 'layout-col',
  },
})
export class MusicSheetsOverviewComponent {
  protected iconFlip = svgRepeat
  protected items$ = combineLatest({
    items: this.db.items.pipe(mapFilter((it) => isMusicSheet(it))),
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
  protected trackByFn: TrackByFunction<ItemDefinitionMaster> = (i, item) => getItemId(item)

  public constructor(
    private db: NwDbService,
    private search: QuicksearchService,
    private i18n: TranslateService,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      title: 'Music Sheets',
      description: 'Overview of all collectable music sheets in New World.',
    })
  }
}
