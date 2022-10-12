import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ScreenModule } from '~/ui/screen'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  selector: 'nwb-territories-page',
  standalone: true,
  templateUrl: './territories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule, QuicksearchModule, ScreenModule],
  providers: [QuicksearchService],
  host: {
    class: 'layout-row screen-gap',
  },
})
export class TerritoriesComponent {
  //
}
