import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { LayoutModule } from '~/ui/layout'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  selector: 'nwb-territories-standing',
  templateUrl: './territories-standing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TerritoryModule, LayoutModule],
  providers: [],
  host: {
    class: 'ion-page',
  },
})
export class TerritoriesStandingComponent {
  //
}
