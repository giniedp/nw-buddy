import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-status-effects-table',
  templateUrl: './status-effects-table.component.html',
  styleUrls: ['./status-effects-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusEffectsTableComponent implements OnInit {
  public constructor(public readonly search: QuicksearchService) {
    //
  }

  public ngOnInit(): void {
    //
  }
}
