import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  selector: 'nwb-crafting-table',
  templateUrl: './crafting-table.component.html',
  styleUrls: ['./crafting-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CraftingTableComponent implements OnInit {
  constructor(public search: QuicksearchService) {}

  ngOnInit(): void {}
}
