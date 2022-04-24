import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core'
import { Subject } from 'rxjs'
import { DataTableAdapter } from '~/ui/data-table'
import { CraftingAdapterService } from './crafting-adapter.service'

@Component({
  selector: 'nwb-crafting',
  templateUrl: './crafting.component.html',
  styleUrls: ['./crafting.component.scss'],
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [DataTableAdapter.provideClass(CraftingAdapterService)],
})
export class CraftingComponent {

}
