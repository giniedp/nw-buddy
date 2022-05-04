import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { HousingAdapterService } from './housing-table-adapter'

@Component({
  selector: 'nwb-housing',
  templateUrl: './housing.component.html',
  styleUrls: ['./housing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [DataTableAdapter.provideClass(HousingAdapterService)],
})
export class HousingComponent {
  //
}
