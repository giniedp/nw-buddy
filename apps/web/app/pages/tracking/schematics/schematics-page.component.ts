import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, viewChild } from '@angular/core'
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router'
import { map, merge, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { ItemPreferencesService } from '~/preferences'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { LayoutModule } from '../../../ui/layout'
import { CharacterAvatarComponent } from '../../../widgets/character'
import { SchematicRecord, SchematicsTableAdapter } from './adapter'

@Component({
  selector: 'nwb-schematics-page',
  templateUrl: './schematics-page.component.html',
  imports: [CommonModule, RouterModule, DataViewModule, VirtualGridModule, LayoutModule, CharacterAvatarComponent],
  providers: [
    provideDataView({
      adapter: SchematicsTableAdapter,
    }),
    QuicksearchModule,
  ],
  host: {
    class: 'ion-page',
  },
})
export class SchematicsPageComponent implements OnInit {
  protected outlet = viewChild(RouterOutlet)
  protected character = inject(CharacterStore)

  protected stats$ = this.service.categoryItems$
    .pipe(
      switchMap((list) => {
        return combineLatestOrEmpty(
          list?.map((it) => {
            return this.character.observeItemMarker(it.recipeItem.ItemID)
          }),
        )
      }),
    )
    .pipe(
      map((list) => {
        const total = list?.length
        const learned = list?.filter((it) => !!it)?.length
        return {
          total: total,
          learned: learned,
          percent: learned / total,
        }
      }),
    )

  public constructor(
    protected service: DataViewService<SchematicRecord>,
    protected search: QuicksearchService,
    protected itemPref: ItemPreferencesService,
    route: ActivatedRoute,
    router: Router,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Schematics Tracker',
    })
  }

  public ngOnInit() {
    const outlet = this.outlet()
    this.service.loadCategory(
      merge(
        outlet.deactivateEvents.pipe(map(() => null)),
        outlet.activateEvents.pipe(switchMap(() => observeRouteParam(outlet.activatedRoute, 'category'))),
      ),
    )
  }
}
