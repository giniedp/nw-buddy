import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { CraftingTableAdapter } from '~/widgets/adapter'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-crafting',
  templateUrl: './crafting.component.html',
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule, NavToolbarModule, ScreenshotModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [CraftingTableAdapter.provider(), QuicksearchService],
})
export class CraftingComponent {
  //
}
