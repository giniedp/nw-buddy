import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, defer, map } from 'rxjs'
import { NwService } from '~/core/nw'
import { observeRouteParam } from '~/core/utils'

@Component({
  templateUrl: './vital.component.html',
  styleUrls: ['./vital.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content flex-none max-w-lg'
  }
})
export class VitalComponent {
  public vitalId = observeRouteParam(this.route, 'id')

  public vital = defer(() =>
    combineLatest({
      id: this.vitalId,
      vitals: this.nw.db.vitalsMap,
    })
  ).pipe(map(({ id, vitals }) => vitals.get(id)))

  public constructor(private route: ActivatedRoute, private nw: NwService) {}
}
