import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'

@Component({
  standalone: true,
  selector: 'nwb-crafting-table',
  templateUrl: './crafting-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule],
  host: {
    class: 'layout-col xl:flex-row',
  },
})
export class CraftingTableComponent {
  public constructor(public search: QuicksearchService) {
    //
  }
}
