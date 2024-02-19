import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { map, switchMap } from 'rxjs'
import { ItemPreferencesService } from '~/preferences'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService } from '~/utils'
import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { TrophiesRecord, TrophiesTableAdapter } from './adapter'

@Component({
  standalone: true,
  selector: 'nwb-trophies-page',
  templateUrl: './trophies-page.component.html',
  imports: [CommonModule, RouterModule, DataViewModule, VirtualGridModule],
  providers: [
    provideDataView({
      adapter: TrophiesTableAdapter,
    }),
    QuicksearchModule,
  ],
  host: {
    class: 'ion-page',
  },
})
export class RunesPageComponent implements OnInit {
  protected stats$ = this.service.categoryItems$
    .pipe(switchMap((list) => combineLatestOrEmpty(list?.map((it) => this.itemPref.observe(it.itemId)))))
    .pipe(
      map((list) => {
        const total = list?.length
        const learned = list?.filter((it) => !!it.meta?.mark)?.length
        return {
          total: total,
          learned: learned,
          percent: learned / total,
        }
      })
    )

  public constructor(
    protected service: DataViewService<TrophiesRecord>,
    protected search: QuicksearchService,
    protected itemPref: ItemPreferencesService,
    head: HtmlHeadService
  ) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Trophies Tracker',
    })
  }

  public ngOnInit() {
    //
  }
}
