import { Component, ChangeDetectionStrategy } from '@angular/core'
import { map } from 'rxjs'
import { NwService } from '~/core/nw'

const REJECT = ['undefined', 'human']
@Component({
  selector: 'nwb-vitals-families-list',
  templateUrl: './vitals-families-list.component.html',
  styleUrls: ['./vitals-families-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitalsFamiliesListComponent {

  public get families() {
    return this.nw.db.vitalsFamilies.pipe(map((it) => it.filter((name) => !REJECT.includes(name))))
  }

  public constructor(private nw: NwService) {
    //
  }

}
