import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  templateUrl: './perks-table.component.html',
  styleUrls: ['./perks-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerksTableComponent implements OnInit {

  public constructor(public search: QuicksearchService) { }

  ngOnInit(): void {
  }

}
