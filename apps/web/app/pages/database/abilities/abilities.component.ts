import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { NavToobalModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { AbilitiesTableAdapter } from '~/widgets/adapter'

@Component({
  standalone: true,
  selector: 'nwb-abilities-page',
  templateUrl: './abilities.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule, NavToobalModule, QuicksearchModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [DataTableAdapter.provideClass(AbilitiesTableAdapter), QuicksearchService],
})
export class AbilitiesComponent {
  //
}
