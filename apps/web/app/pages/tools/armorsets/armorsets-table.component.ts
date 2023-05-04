import { Component, OnInit, ChangeDetectionStrategy, TrackByFunction, ViewChild } from '@angular/core'
import { defer, map } from 'rxjs'
import { HtmlHeadService, shareReplayRefCount } from '~/utils'
import { DataTableComponent, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { Armorset } from './types'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-armorsets-table',
  templateUrl: './armorsets-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    DataTableModule,
    QuicksearchModule,
    ItemDetailModule,
    ScreenshotModule,
  ],
  host: {
    class: 'layout-col xl:flex-row',
  },
})
export class ArmorsetsTableComponent implements OnInit {
  public trackByIndex: TrackByFunction<any> = (i) => i

  @ViewChild(DataTableComponent, { static: true })
  public table: DataTableComponent<Armorset>

  public selectedItems = defer(() => this.table.selectedItem)
    .pipe(map((it) => it?.items))
    .pipe(shareReplayRefCount(1))

  public constructor(public search: QuicksearchService, head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Armor Sets',
      description: 'Overview of all available Armor Sets'
    })
  }

  public ngOnInit(): void {}
}
