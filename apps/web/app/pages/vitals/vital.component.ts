import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { uniq } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwService } from '~/core/nw'
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
      vitals: this.nw.db.vitalsMap,
    })
  ).pipe(map(({ id, vitals }) => vitals.get(id)))

  public lootTableId$ = defer(() => this.vital$)
    .pipe(map((it) => it.LootTableId))

  public lootTags$ = defer(() => combineLatest({
    vital: this.vital$,
    dungeons: this.nw.db.gameModes,
    difficulties: this.nw.db.mutatorDifficulties,
    territories: this.nw.db.territories
  }))
  .pipe(map(({ vital, dungeons, difficulties, territories }) => {

    const dungeon = getVitalDungeon(vital, dungeons)
    return [
      // base
      ...(vital.LootTags || []),
      // include dungeons and mutations and mutation difficulties
      ...(dungeon?.LootTags || []),
      ...(dungeon?.MutLootTagsOverride || []),
      ...uniq(difficulties.map((it) => it.InjectedLootTags).flat(1)),
      // include all territories
      ...territories.map((it) => it.LootTags?.split(',') || []).flat(1)
    ]
  }))

  public constructor(private route: ActivatedRoute, private nw: NwService) {}
}
