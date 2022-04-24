import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { StatusEffectsAdapterService } from './status-effects-adapter.service'

@Component({
  selector: 'nwb-status-effects',
  templateUrl: './status-effects.component.html',
  styleUrls: ['./status-effects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
  providers: [
    DataTableAdapter.provideClass(StatusEffectsAdapterService)
  ]
})
export class StatusEffectsComponent {
  //
}
