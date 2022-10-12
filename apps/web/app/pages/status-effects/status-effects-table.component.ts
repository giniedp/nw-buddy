import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-status-effects-table',
  templateUrl: './status-effects-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-column xl:flex-row screen-gap',
  },
})
export class StatusEffectsTableComponent implements OnInit {
  public constructor(public readonly search: QuicksearchService) {
    //
  }

  public ngOnInit(): void {
    //
  }
}
