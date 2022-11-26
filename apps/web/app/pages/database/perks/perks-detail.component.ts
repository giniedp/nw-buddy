import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { PropertyGridModule } from '~/ui/property-grid'
import { observeRouteParam } from '~/utils'
import { PerkDetailModule } from '~/widgets/perk-detail'

@Component({
  standalone: true,
  selector: 'nwb-perks-detail',
  templateUrl: './perks-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, PerkDetailModule, PropertyGridModule, LayoutModule],
  host: {
    class: 'flex-none flex flex-col bg-base-300',
  },
})
export class PerksDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')

  public constructor(private route: ActivatedRoute) {
    //
  }
}
