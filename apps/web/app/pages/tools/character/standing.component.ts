import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, TrackByFunction } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TerritoryDefinition } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { combineLatest, defer, map, switchMap } from 'rxjs'
import { CharacterStore, injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { TerritoriesService } from '~/nw/territories'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchService } from '~/ui/quicksearch'
import { shareReplayRefCount } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'
import { SvgIconComponent } from '../../../ui/icons'
import { svgInfoCircle } from '../../../ui/icons/svg'

@Component({
  selector: 'nwb-standing',
  templateUrl: './standing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule, LayoutModule, SvgIconComponent],
  host: {
    class: 'ion-page',
  },
})
export class StandingComponent {
  private db = injectNwData()
  private character = inject(CharacterStore)
  private search = inject(QuicksearchService)
  protected infoIcon = svgInfoCircle

  protected territories$ = defer(() => this.territories())
    .pipe(switchMap((it) => combineLatest(it.map((i) => this.territoryWithinfo(i)))))
    .pipe(map((it) => it.filter((i) => i.matchSearch)))
    .pipe(map((it) => it.map((i) => i.territory)))
    .pipe(shareReplayRefCount(1))

  protected trackByIndex: TrackByFunction<any> = (i) => i
  protected trackById: TrackByFunction<TerritoryDefinition> = (i, it) => it?.TerritoryID

  private territories() {
    return defer(() => this.db.territoriesAll())
      .pipe(map((list) => list.filter((it) => it.IsTerritory && !!it.TerritoryStandingXpModifier)))
      .pipe(map((list) => sortBy(list, (it) => it.NameLocalizationKey)))
  }

  private territoryWithinfo(it: TerritoryDefinition) {
    return combineLatest({
      search: this.search.query$,
      pref: this.character.observeTerritoryData(it.TerritoryID),
    }).pipe(
      map(({ search, pref }) => {
        const matchNotes = testString(pref?.notes, search)
        const matchTags = pref?.tags?.some((tag) => testString(tag, search))
        const matchName = testString(it.NameLocalizationKey, search)

        return {
          territory: it,
          pref: pref,
          matchSearch: matchName || matchTags || matchNotes,
        }
      }),
    )
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
