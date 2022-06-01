import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-housing-table',
  templateUrl: './housing-table.component.html',
  styleUrls: ['./housing-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HousingTableComponent implements OnInit {
  constructor(public search: QuicksearchService) {}

  ngOnInit(): void {}
}
