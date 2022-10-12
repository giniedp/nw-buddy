import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { HousingAdapterService } from './housing-table-adapter'

@Component({
  selector: 'nwb-housing',
  templateUrl: './housing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 layout-column',
  },
  providers: [DataTableAdapter.provideClass(HousingAdapterService), QuicksearchService],
})
export class HousingComponent {
  //
}
