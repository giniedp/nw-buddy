import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { LootTableAdapter } from '~/widgets/adapter'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-loot-page',
  templateUrl: './loot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataTableModule,
    FormsModule,
    IonicModule,
    LootModule,
    NavToolbarModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    TooltipModule,
  ],
  providers: [
    LootTableAdapter.provider(),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  host: {
    class: 'layout-col',
  },
})
export class LootPageComponent {
  public constructor() {
    //
  }
}
