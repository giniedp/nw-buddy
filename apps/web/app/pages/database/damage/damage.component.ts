import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { DamageTableAdapter } from '~/widgets/adapter/damage-table-adapter'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-damage-page',
  templateUrl: './damage.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataTableModule,
    FormsModule,
    IonicModule,
    LootModule,
    NavbarModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    TooltipModule,
  ],
  providers: [
    DamageTableAdapter.provider(),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  host: {
    class: 'layout-col',
  },
})
export class DamagePageComponent {
  public constructor() {
    //
  }
}
