import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-housing-table',
  templateUrl: './housing-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-column xl:flex-row screen-gap',
  },
})
export class HousingTableComponent implements OnInit {
  constructor(public search: QuicksearchService) {}

  ngOnInit(): void {}
}
