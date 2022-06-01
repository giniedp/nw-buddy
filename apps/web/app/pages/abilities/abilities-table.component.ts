import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  selector: 'nwb-abilities-table',
  templateUrl: './abilities-table.component.html',
  styleUrls: ['./abilities-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitiesTableComponent implements OnInit {

  constructor(public search: QuicksearchService) { }

  ngOnInit(): void {
  }

}
