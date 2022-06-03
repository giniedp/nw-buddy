import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { PerksAdapterService } from './perks-table-adapter'

@Component({
  selector: 'nwb-perks',
  templateUrl: './perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
  providers: [
    DataTableAdapter.provideClass(PerksAdapterService)
  ]
})
export class PerksComponent {
  //
}
