import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  selector: 'nwb-items-table',
  templateUrl: './items-table.component.html',
  styleUrls: ['./items-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsTableComponent implements OnInit {

  constructor(public search: QuicksearchService) { }

  ngOnInit(): void {
  }

}
