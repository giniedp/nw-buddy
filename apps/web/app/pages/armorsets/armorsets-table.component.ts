import { Component, OnInit, ChangeDetectionStrategy, TrackByFunction } from '@angular/core'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  selector: 'nwb-armorsets-table',
  templateUrl: './armorsets-table.component.html',
  styleUrls: ['./armorsets-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmorsetsTableComponent implements OnInit {
  public trackByIndex: TrackByFunction<any> = (i) => i
  constructor(public search: QuicksearchService) {}

  ngOnInit(): void {}
}
