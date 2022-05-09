import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { PerksAdapterService } from './perks-table-adapter'

@Component({
  selector: 'nwb-perks',
  templateUrl: './perks.component.html',
  styleUrls: ['./perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu',
  },
  providers: [
    DataTableAdapter.provideClass(PerksAdapterService)
  ]
})
export class PerksComponent {
  //
}
