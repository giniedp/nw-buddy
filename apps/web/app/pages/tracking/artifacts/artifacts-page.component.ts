import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, ViewChild } from '@angular/core'
import { RouterModule, RouterOutlet } from '@angular/router'
import { map, merge, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { LayoutModule } from '../../../ui/layout'
import { TooltipModule } from '../../../ui/tooltip'
import { CharacterAvatarComponent } from '../../../widgets/character'
import { ArtifactRecord, ArtifactsTableAdapter } from './adapter'

@Component({
  selector: 'nwb-artifacts-page',
  templateUrl: './artifacts-page.component.html',
  imports: [
    CommonModule,
    RouterModule,
    DataViewModule,
    VirtualGridModule,
    CharacterAvatarComponent,
    LayoutModule,
    QuicksearchModule,
    TooltipModule,
  ],
  providers: [
    provideDataView({
      adapter: ArtifactsTableAdapter,
    }),
  ],
  host: {
    class: 'ion-page',
  },
})
export class ArtifactsPageComponent implements OnInit {
  @ViewChild(RouterOutlet, { static: true })
  protected outlet: RouterOutlet

  protected service = inject(DataViewService<ArtifactRecord>)
  protected search = inject(QuicksearchService)
  protected character = inject(CharacterStore)

  protected stats$ = this.service.categoryItems$
    .pipe(switchMap((list) => combineLatestOrEmpty(list?.map((it) => this.character.observeItemMarker(it.ItemID)))))
    .pipe(
      map((list) => {
        const total = list?.length
        const learned = list?.filter((marker) => !!marker)?.length
        return {
          total: total,
          learned: learned,
          percent: learned / total,
        }
      }),
    )

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Artifacts Tracker',
    })
  }

  public ngOnInit() {
    this.service.loadCategory(
      merge(
        this.outlet.deactivateEvents.pipe(map(() => null)),
        this.outlet.activateEvents.pipe(switchMap(() => observeRouteParam(this.outlet.activatedRoute, 'category'))),
      ),
    )
  }
}
