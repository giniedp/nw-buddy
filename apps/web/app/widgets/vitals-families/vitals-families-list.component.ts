import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { defer, map } from 'rxjs'
import { NwDbService } from '~/nw'

const REJECT = ['undefined', 'human']
@Component({
  selector: 'nwb-vitals-families-list',
  templateUrl: './vitals-families-list.component.html',
  styleUrls: ['./vitals-families-list.component.scss'],
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

  public families$ = defer(() => this.db.vitalsFamilies).pipe(
    map((it) => it.filter((name) => !REJECT.includes(name)))
  )

  public constructor(private db: NwDbService) {
    //
  }
}
