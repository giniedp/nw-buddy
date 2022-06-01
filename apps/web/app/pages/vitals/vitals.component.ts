import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { VitalsAdapterService } from './vitals-table-adapter'

@Component({
  selector: 'nwb-vitals',
  templateUrl: './vitals.component.html',
  styleUrls: ['./vitals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
  providers: [DataTableAdapter.provideClass(VitalsAdapterService), QuicksearchService],
})
export class VitalsComponent {}
