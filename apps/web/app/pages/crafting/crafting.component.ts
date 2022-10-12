import { Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { CraftingTableAdapter } from '~/widgets/adapter'

@Component({
  selector: 'nwb-crafting',
  templateUrl: './crafting.component.html',
  host: {
    class: 'flex-1 layout-column',
  },
  providers: [DataTableAdapter.provideClass(CraftingTableAdapter), QuicksearchService],
})
export class CraftingComponent {
  //
}
