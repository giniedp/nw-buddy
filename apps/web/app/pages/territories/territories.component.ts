import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  selector: 'nwb-territories-page',
  standalone: true,
  templateUrl: './territories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule],
  host: {
    class: 'layout-row gap-4',
  },
})
export class TerritoriesComponent {
  //
}
