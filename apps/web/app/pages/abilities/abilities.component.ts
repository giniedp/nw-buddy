import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { AbilitiesAdapterService } from './abilities-table-adapter'

@Component({
  selector: 'nwb-abilities',
  templateUrl: './abilities.component.html',
  styleUrls: ['./abilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [
    DataTableAdapter.provideClass(AbilitiesAdapterService)
  ]
})
export class AbilitiesComponent {
  //
}
