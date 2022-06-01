import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { ItemsTableAdapter } from './items-table-adapter'

@Component({
  selector: 'nwb-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
  providers: [DataTableAdapter.provideClass(ItemsTableAdapter), QuicksearchService],
})
export class ItemsComponent {}
