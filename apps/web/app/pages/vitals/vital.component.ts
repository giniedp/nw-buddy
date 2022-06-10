import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, defer, map, tap } from 'rxjs'
import { NwService } from '~/core/nw'
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

  public constructor(private route: ActivatedRoute, private nw: NwService) {}
}
