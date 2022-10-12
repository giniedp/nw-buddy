import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { StatusEffectsTableAdapter } from '~/widgets/adapter'

@Component({
  selector: 'nwb-status-effects',
  templateUrl: './status-effects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-1 layout-column',
  },
  providers: [DataTableAdapter.provideClass(StatusEffectsTableAdapter), QuicksearchService],
})
export class StatusEffectsComponent {
  //
}
