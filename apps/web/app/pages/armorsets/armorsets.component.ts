import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { ArmorsetsAdapterService } from './armorsets-adapter.service'

@Component({
  selector: 'nwb-armorsets',
  templateUrl: './armorsets.component.html',
  styleUrls: ['./armorsets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu',
  },
  providers: [DataTableAdapter.provideClass(ArmorsetsAdapterService)],
})
export class ArmorsetsComponent {
  //
}
