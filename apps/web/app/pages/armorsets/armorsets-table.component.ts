import { Component, OnInit, ChangeDetectionStrategy, TrackByFunction, ViewChild } from '@angular/core'
import { defer, map } from 'rxjs'
import { shareReplayRefCount } from '~/utils'
import { DataTableComponent } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { Armorset } from './types'

@Component({
  selector: 'nwb-armorsets-table',
  templateUrl: './armorsets-table.component.html',
  styleUrls: ['./armorsets-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
})
export class ArmorsetsTableComponent implements OnInit {
  public trackByIndex: TrackByFunction<any> = (i) => i

  @ViewChild(DataTableComponent, { static: true })
  public table: DataTableComponent<Armorset>

  public selectedItems = defer(() => this.table.selectedItem)
    .pipe(map((it) => it?.items))
    .pipe(shareReplayRefCount(1))

  public constructor(public search: QuicksearchService) {}

  public ngOnInit(): void {}
}
