import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { Damagetable, Vitals } from '@nw-data/types'
import { uniq } from 'lodash'
import { combineLatest, defer, map, Observable, of, shareReplay, switchMap } from 'rxjs'

import { NwDbService, NwModule } from '~/nw'
import { getVitalDungeon } from '~/nw/utils'
import { LayoutModule } from '~/ui/layout'
import { CaseInsensitiveMap, observeQueryParam, observeRouteParam, shareReplayRefCount, tapDebug } from '~/utils'
import { LootModule } from '~/widgets/loot'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'

export type DetailTabId = 'loot-items' | 'loot-table' | 'damage-table'

@Component({
  standalone: true,
  templateUrl: './vital.component.html',
  styleUrls: ['./vital.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, VitalsFamiliesModule, LootModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class VitalComponent {
  public vitalId$ = observeRouteParam(this.route, 'id')
  public tabId$ = observeQueryParam(this.route, 'tab').pipe(map((it: DetailTabId): DetailTabId => it || 'loot-items'))

  public vital$ = this.db.vital(this.vitalId$).pipe(shareReplayRefCount(1))
  public lootTableId$ = this.vital$.pipe(map((it) => it?.LootTableId))

  public lootTags$ = defer(() =>
    combineLatest({
      vital: this.vital$,
      dungeons: this.db.gameModes,
      difficulties: this.db.mutatorDifficulties,
      territories: this.db.territories,
    })
  ).pipe(
    map(({ vital, dungeons, difficulties, territories }) => {
      const dungeon = getVitalDungeon(vital, dungeons)
      const result: string[] = [...(vital.LootTags || []), ...territories.map((it) => it.LootTags || []).flat(1)]
      if (dungeon) {
        result.push(
          ...(dungeon.LootTags || []),
          ...(dungeon.MutLootTagsOverride || []),
          ...difficulties.map((it) => it.InjectedLootTags).flat(1)
        )
      }
      return uniq(result)
    })
  )

  public constructor(private route: ActivatedRoute, private router: Router, private db: NwDbService) {
    //
  }

  public openTab(tab: DetailTabId) {
    this.router.navigate([], {
      queryParams: {
        tab: tab
      },
      queryParamsHandling: 'merge',
      relativeTo: this.route
    })
  }
}
