import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { groupBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getVitalDungeon } from '~/nw/utils'
import { VitalDetailComponent } from './vital-detail.component'

@Component({
  standalone: true,
  selector: 'nwb-vitals-dungeon-bosses',
  templateUrl: './vitals-dungeon-bosses.component.html',
  styleUrls: ['./vitals-dungeon-bosses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, VitalDetailComponent],
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(50, [animate('0.3s', style({ opacity: 1 }))])]),
      ]),
    ]),
    trigger('apperAnimation', [
      state('*', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('* => true', [animate('0.3s')]),
    ]),
  ],
})
export class VitalsDungeonBossesListComponent {
  protected vitals$ = this.db.vitalsByCreatureType
  protected bosses$ = this.vitals$.pipe(map((vitals) => {
    const miniBosses = vitals.get('DungeonMiniBoss') || []
    const bosses = vitals.get('DungeonBoss') || []
    const result = [...miniBosses, ...bosses]
    return result
  }))

  public entities = defer(() =>
    combineLatest({
      vitals: this.bosses$,
      vitalsMeta: this.db.vitalsMetadataMap,
      dungeons: this.db.gameModes,
    })
  )
    .pipe(
      map(({ vitals, vitalsMeta, dungeons }) => {
        return vitals.map((vital) => {
          return {
            vital,
            dungeon: getVitalDungeon(vital, dungeons, vitalsMeta),
          }
        })
      })
    )
    .pipe(
      map((it) => groupBy(it, (e) => e.dungeon?.GameModeId)),
      map((it) =>
        Object.entries(it).map(([_, list]) => {
          return {
            dungeon: list[0].dungeon,
            vitals: list.map((it) => it.vital),
          }
        }).filter((it) => !!it.dungeon)
      ),

    )

  public constructor(private db: NwDbService) {
    //
  }
}
