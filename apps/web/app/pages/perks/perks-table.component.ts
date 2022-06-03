import { Component, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  templateUrl: './perks-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
})
export class PerksTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
