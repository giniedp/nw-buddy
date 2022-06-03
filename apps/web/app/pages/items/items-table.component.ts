import { Component, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-items-table',
  templateUrl: './items-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
})
export class ItemsTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
