import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ScreenModule } from '~/ui/screen'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  standalone: true,
  selector: 'nwb-territories-page',
  templateUrl: './territories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule, QuicksearchModule, ScreenModule, NavToolbarModule],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
})
export class TerritoriesComponent {
  //
}
