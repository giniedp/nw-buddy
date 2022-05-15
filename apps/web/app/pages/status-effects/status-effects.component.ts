import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { StatusEffectsAdapterService } from './status-effects-table-adapter'

@Component({
  selector: 'nwb-status-effects',
  templateUrl: './status-effects.component.html',
  styleUrls: ['./status-effects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu',
  },
  providers: [
    DataTableAdapter.provideClass(StatusEffectsAdapterService)
  ]
})
export class StatusEffectsComponent {
  //
}
