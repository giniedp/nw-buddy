import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DestroyService } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  standalone: true,
  selector: 'nwb-territories-governance',
  templateUrl: './territories-governance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TerritoryModule],
  providers: [DestroyService],
  host: {
    class: 'layout-row gap-4',
  },
})
export class TerritoriesGovernanceComponent {
  //
}
