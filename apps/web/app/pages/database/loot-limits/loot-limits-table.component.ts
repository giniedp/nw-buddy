import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  standalone: true,
  selector: 'nwb-loot-limits-table',
  templateUrl: './loot-limits-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, DataTableModule, RouterModule],
  host: {
    class: 'layout-row layout-gap',
  },
})
export class LootLimitsTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
