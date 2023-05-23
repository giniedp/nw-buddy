import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { LootLimitsTableAdapter } from '~/widgets/adapter'

@Component({
  standalone: true,
  selector: 'nwb-loot-limits-page',
  templateUrl: './loot-limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule, NavToolbarModule, IonicModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [
    LootLimitsTableAdapter.provider(),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    NwExpressionContextService,
  ],
})
export class LootLimitsComponent {
  public constructor(public ctx: NwExpressionContextService) {}
}
