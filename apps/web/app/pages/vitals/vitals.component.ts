import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { VitalsTableAdapter } from '~/widgets/adapter'

@Component({
  selector: 'nwb-vitals',
  templateUrl: './vitals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 layout-column',
  },
  providers: [DataTableAdapter.provideClass(VitalsTableAdapter), QuicksearchService],
})
export class VitalsComponent {}
