import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule } from '~/ui/quicksearch'
import { PoiTableAdapter } from '~/widgets/adapter'

@Component({
  standalone: true,
  selector: 'nwb-poi-page',
  templateUrl: './poi.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule, NavToolbarModule, IonicModule],
  host: {
    class: 'layout-col',
  },
  providers: [
    PoiTableAdapter.provider(),
    NwExpressionContextService
  ]
})
export class PoiComponent {

  public constructor(public ctx: NwExpressionContextService) {

  }
}
