import { Component, OnInit, ChangeDetectionStrategy, OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { map, Subject, tap } from 'rxjs'
import { NwService } from '~/core/nw'

const REJECT = ['undefined', 'human']
@Component({
  selector: 'nwb-vitals-families-list',
  templateUrl: './vitals-families-list.component.html',
  styleUrls: ['./vitals-families-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitalsFamiliesListComponent implements OnInit, OnChanges, OnDestroy {
  public get families() {
    return this.nw.db.vitalsFamilies.pipe(map((it) => it.filter((name) => !REJECT.includes(name))))
  }

  private destroy$ = new Subject()

  public constructor(private nw: NwService) {
    //
  }

  public ngOnInit(): void {
    //
  }

  public ngOnChanges(): void {
    //
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
