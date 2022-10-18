import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { PropertyGridModule } from '~/ui/property-grid'
import { observeRouteParam } from '~/utils'
import { AbilityDetailModule } from '~/widgets/ability-detail'

@Component({
  standalone: true,
  selector: 'nwb-abilities-detail',
  templateUrl: './abilities-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, AbilityDetailModule, PropertyGridModule],
  host: {
    class: 'layout-content xl:max-w-md p-3',
  },
})
export class AbilitiesDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')

  public constructor(private route: ActivatedRoute) {
    //
  }
}
