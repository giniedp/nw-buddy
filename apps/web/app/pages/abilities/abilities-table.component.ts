import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  selector: 'nwb-abilities-table',
  templateUrl: './abilities-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-column xl:flex-row screen-gap',
  },
})
export class AbilitiesTableComponent implements OnInit {

  constructor(public search: QuicksearchService) { }

  ngOnInit(): void {
  }

}
