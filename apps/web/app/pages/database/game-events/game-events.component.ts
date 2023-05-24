import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { GameEventsTableAdapter } from '~/widgets/adapter'

@Component({
  standalone: true,
  selector: 'nwb-game-events-page',
  templateUrl: './game-events.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule, NavToolbarModule, IonicModule],
  host: {
    class: 'layout-col',
  },
  providers: [
    GameEventsTableAdapter.provider(),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
    NwExpressionContextService,
  ],
})
export class GameEventsComponent {
  public constructor(public ctx: NwExpressionContextService) {}
}
