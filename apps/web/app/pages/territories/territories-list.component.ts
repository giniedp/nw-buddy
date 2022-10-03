import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { sortBy } from 'lodash'
import { defer, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  selector: 'nwb-territories-list',
  standalone: true,
  templateUrl: './territories-list.component.html',
  styleUrls: ['./territories-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule],
  host: {
    class: 'layout-row gap-4',
  },
})
export class TerritoriesListComponent {


  public territories$ = defer(() => this.db.territories)
    .pipe(map((list) => list.filter((it) => it.IsTerritory && !!it.TerritoryStandingXpModifier)))
    .pipe(map((list) => sortBy(list, (it) => it.NameLocalizationKey)))
    .pipe(shareReplayRefCount(1))

  public tab$ = defer(() => this.route.paramMap).pipe(map((it) => it.get('tab')))

  public constructor(private db: NwDbService, private route: ActivatedRoute) {
    //
  }


}
