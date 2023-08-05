import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  standalone: true,
  selector: 'nwb-territories-page',
  templateUrl: './territories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule, QuicksearchModule, NavbarModule],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-200 rounded-md overflow-clip',
  },
})
export class TerritoriesComponent {
  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Territories',
      description: 'Overview of all Territories in New World',
      noFollow: true,
      noIndex: true
    })
  }
}
