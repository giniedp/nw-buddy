import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { AbilitiesAdapterService } from './abilities-table-adapter'

@Component({
  selector: 'nwb-abilities',
  templateUrl: './abilities.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
  providers: [
    DataTableAdapter.provideClass(AbilitiesAdapterService),
    QuicksearchService
  ]
})
export class AbilitiesComponent {
  //
}
