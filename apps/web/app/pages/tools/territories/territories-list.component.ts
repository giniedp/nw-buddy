import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { Territorydefinitions } from '@nw-data/types'
import { sortBy } from 'lodash'
import { combineLatest, defer, map, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { TerritoriesService } from '~/nw/territories'
import { QuicksearchService } from '~/ui/quicksearch'
import { shareReplayRefCount } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  standalone: true,
  selector: 'nwb-territories-list',
  templateUrl: './territories-list.component.html',
  styleUrls: ['./territories-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule],
  host: {
    class: 'layout-row layout-gap layout-pad',
  },
})
export class TerritoriesListComponent {
  protected territories$ = defer(() => this.territories())
    .pipe(switchMap((it) => combineLatest(it.map((i) => this.territoryWithinfo(i)))))
    .pipe(map((it) => it.filter((i) => i.matchSearch)))
    .pipe(map((it) => it.map((i) => i.territory)))
    .pipe(shareReplayRefCount(1))

  protected trackByIndex: TrackByFunction<any> = (i) => i
  protected trackById: TrackByFunction<Territorydefinitions> = (i, it) => it?.TerritoryID

  public constructor(
    private db: NwDbService,
    private i18n: TranslateService,
    private search: QuicksearchService,
    private service: TerritoriesService
  ) {
    //
  }

  private territories() {
    return defer(() => this.db.territories)
      .pipe(map((list) => list.filter((it) => it.IsTerritory && !!it.TerritoryStandingXpModifier)))
      .pipe(map((list) => sortBy(list, (it) => it.NameLocalizationKey)))
  }

  private territoryWithinfo(it: Territorydefinitions) {
    return combineLatest({
      search: this.search.query,
      pref: this.service.getPreferences(it.TerritoryID)
    })
    .pipe(map(({ search, pref }) => {
      const matchNotes = testString(pref?.notes, search)
      const matchTags = pref?.tags?.some((tag) => testString(tag, search))
      const matchName = testString(it.NameLocalizationKey, search)

      return {
        territory: it,
        pref: pref,
        matchSearch: matchName || matchTags || matchNotes
      }
    }))
  }
}

function testString(hay: string, needle: string) {
  if (!needle) {
    return true
  }
  if (!hay) {
    return false
  }
  return String(hay).toLocaleLowerCase().includes(needle.toLocaleLowerCase())
}
