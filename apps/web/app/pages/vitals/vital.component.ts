import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { uniq } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService } from '~/core/nw'
import { getVitalDungeon } from '~/core/nw/utils'
import { observeRouteParam } from '~/core/utils'

@Component({
  templateUrl: './vital.component.html',
  styleUrls: ['./vital.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-column flex-none max-w-lg gap-4'
  }
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
