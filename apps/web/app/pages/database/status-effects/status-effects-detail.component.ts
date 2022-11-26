import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { observeRouteParam } from '~/utils'
import { StatusEffectDetailModule } from '~/widgets/status-effect-detail'

@Component({
  standalone: true,
  selector: 'nwb-status-effects-detail',
  templateUrl: './status-effects-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, StatusEffectDetailModule, PropertyGridModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col',
  },
})
export class AbilitiesDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')

  public constructor(private route: ActivatedRoute) {
    //
  }
}
