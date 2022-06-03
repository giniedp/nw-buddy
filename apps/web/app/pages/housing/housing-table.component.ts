import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-housing-table',
  templateUrl: './housing-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
})
export class HousingTableComponent implements OnInit {
  constructor(public search: QuicksearchService) {}

  ngOnInit(): void {}
}
