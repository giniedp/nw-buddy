import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { ItemsTableAdapter } from '~/widgets/adapter'

@Component({
  selector: 'nwb-items-page',
  templateUrl: './items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 layout-column',
  },
  providers: [DataTableAdapter.provideClass(ItemsTableAdapter), QuicksearchService],
})
export class ItemsComponent {
  //
}
