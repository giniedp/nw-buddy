import { Component, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  templateUrl: './perks-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-column xl:flex-row screen-gap',
  },
})
export class PerksTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
