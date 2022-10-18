import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule } from '~/ui/quicksearch'
import { PerksTableAdapter } from '~/widgets/adapter'
import { ExprContextService } from '~/widgets/adapter/exp-context.service'
import { PoiTableAdapter } from './poi-table-adapter'

@Component({
  standalone: true,
  selector: 'nwb-poi-page',
  templateUrl: './poi.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [
    DataTableAdapter.provideClass(PoiTableAdapter),
    ExprContextService
  ]
})
export class PoiComponent {

  public constructor(public ctx: ExprContextService) {

  }
}
