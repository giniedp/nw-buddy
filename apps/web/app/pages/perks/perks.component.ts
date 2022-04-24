import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { PerksAdapterService } from './perks-adapter.service'

@Component({
  selector: 'nwb-perks',
  templateUrl: './perks.component.html',
  styleUrls: ['./perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [
    DataTableAdapter.provideClass(PerksAdapterService)
  ]
})
export class PerksComponent {
  //
}
