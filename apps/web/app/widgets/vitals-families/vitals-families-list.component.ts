import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { combineLatest, defer, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { vitalForFamily } from './utils'
import { VitalDetailComponent } from './vital-detail.component'

const REJECT = ['undefined', 'human']
@Component({
  standalone: true,
  selector: 'nwb-vitals-families-list',
  templateUrl: './vitals-families-list.component.html',
  styleUrls: ['./vitals-families-list.component.scss'],
  imports: [CommonModule, VitalDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  ]
})
export class VitalsFamiliesListComponent {

  public vitals$ = defer(() => this.db.vitalsFamilies)
    .pipe(map((it) => it.filter((name) => !REJECT.includes(name))))
    .pipe(switchMap((families) => {
      return combineLatest(families.map((family) => vitalForFamily(family, this.db)))
    }))


  public constructor(private db: NwDbService) {
    //
  }
}
