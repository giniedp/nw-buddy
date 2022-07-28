import { Component, ChangeDetectionStrategy } from '@angular/core'
import { defer, map } from 'rxjs'
import { NwDbService } from '~/core/nw'

const REJECT = ['undefined', 'human']
@Component({
  selector: 'nwb-vitals-families-list',
  templateUrl: './vitals-families-list.component.html',
  styleUrls: ['./vitals-families-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitalsFamiliesListComponent {

  public families = defer(() => this.db.vitalsFamilies).pipe(
    map((it) => it.filter((name) => !REJECT.includes(name)))
  )

  public constructor(private db: NwDbService) {
    //
  }
}
