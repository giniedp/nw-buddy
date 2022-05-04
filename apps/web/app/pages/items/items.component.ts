import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { ItemsTableAdapter } from './items-table-adapter'

@Component({
  selector: 'nwb-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [
    DataTableAdapter.provideClass(ItemsTableAdapter)
  ]
})
export class ItemsComponent {

}
