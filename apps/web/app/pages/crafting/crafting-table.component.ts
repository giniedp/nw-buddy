import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { QuicksearchService } from '~/ui/quicksearch';

@Component({
  selector: 'nwb-crafting-table',
  templateUrl: './crafting-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-column xl:flex-row screen-gap',
  },
})
export class CraftingTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
