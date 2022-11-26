import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { uniq } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getVitalDungeon } from '~/nw/utils'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { LootModule } from '~/widgets/loot'
import { VitalsFamiliesModule } from '~/widgets/vitals-families'

@Component({
  standalone: true,
  templateUrl: './vital.component.html',
  styleUrls: ['./vital.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, VitalsFamiliesModule, LootModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col bg-base-300',
  },
})
export class VitalComponent {
  public vitalId = observeRouteParam(this.route, 'id')

  public vital$ = defer(() =>
    combineLatest({
      id: this.vitalId,
      vitals: this.db.vitalsMap,
    })
  ).pipe(map(({ id, vitals }) => vitals.get(id)))

  public lootTableId$ = defer(() => this.vital$)
    .pipe(map((it) => it.LootTableId))

  public lootTags$ = defer(() => combineLatest({
    vital: this.vital$,
    dungeons: this.db.gameModes,
    difficulties: this.db.mutatorDifficulties,
    territories: this.db.territories
  }))
  .pipe(map(({ vital, dungeons, difficulties, territories }) => {
    const dungeon = getVitalDungeon(vital, dungeons)
    const result: string[] = [
      ...(vital.LootTags || []),
      ...territories.map((it) => it.LootTags || []).flat(1)
    ]
    if (dungeon) {
      result.push(
        ...(dungeon.LootTags || []),
        ...(dungeon.MutLootTagsOverride || []),
        ...difficulties.map((it) => it.InjectedLootTags).flat(1)
      )
    }
    return uniq(result)
  }))

  public constructor(private route: ActivatedRoute, private db: NwDbService) {
    //
  }
}
