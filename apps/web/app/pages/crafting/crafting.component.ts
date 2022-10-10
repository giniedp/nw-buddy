import { Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { CraftingTableAdapter } from '~/widgets/adapter'

@Component({
  selector: 'nwb-crafting',
  templateUrl: './crafting.component.html',
  host: {
    class: 'layout-row gap-4',
  },
  providers: [DataTableAdapter.provideClass(CraftingTableAdapter), QuicksearchService],
})
export class CraftingComponent {
  //
}
