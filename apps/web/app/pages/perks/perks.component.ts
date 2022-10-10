import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DataTableAdapter } from '~/ui/data-table'
import { PerksTableAdapter } from '~/widgets/adapter'
import { ExprContextService } from '~/widgets/adapter/exp-context.service'

@Component({
  selector: 'nwb-perks',
  templateUrl: './perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-row gap-4',
  },
  providers: [
    DataTableAdapter.provideClass(PerksTableAdapter),
    ExprContextService
  ]
})
export class PerksComponent {

  public constructor(public ctx: ExprContextService) {

  }
}
