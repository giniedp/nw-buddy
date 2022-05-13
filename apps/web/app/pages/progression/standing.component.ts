import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { defer, map } from 'rxjs';
import { NwService } from '~/core/nw';
import { shareReplayRefCount } from '~/core/utils';

@Component({
  selector: 'nwb-standing',
  templateUrl: './standing.component.html',
  styleUrls: ['./standing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingComponent implements OnInit {

  public territories$ = defer(() => this.nw.db.territories)
    .pipe(map((list) => list.filter((it) => it.IsTerritory && !!it.TerritoryStandingXpModifier)))
    .pipe(shareReplayRefCount(1))


  public constructor(private nw: NwService) {
    //
  }

  ngOnInit(): void {
  }

}
