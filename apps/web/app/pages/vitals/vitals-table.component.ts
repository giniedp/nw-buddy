import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  selector: 'nwb-vitals-table',
  templateUrl: './vitals-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row screen-gap',
  },
})
export class VitalsTableComponent implements OnInit {

  public constructor(public readonly search: QuicksearchService) {
    //
  }

  public ngOnInit(): void {
    //
  }

}
