import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { NavToobalModule } from '~/ui/nav-toolbar'
import { QuicksearchModule } from '~/ui/quicksearch'
import { LootLimitsTableAdapter } from '~/widgets/adapter'
import { ExprContextService } from '~/widgets/adapter/exp-context.service'

@Component({
  standalone: true,
  selector: 'nwb-loot-limits-page',
  templateUrl: './loot-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule, NavToobalModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [DataTableAdapter.provideClass(LootLimitsTableAdapter), ExprContextService],
})
export class LootLimitsComponent {
  public constructor(public ctx: ExprContextService) {}
}
