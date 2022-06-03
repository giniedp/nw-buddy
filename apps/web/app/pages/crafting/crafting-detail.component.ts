import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { observeRouteParam } from '~/core/utils'

@Component({
  selector: 'nwb-crafting-detail',
  templateUrl: './crafting-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content flex-none max-w-lg'
  }
})
export class CraftingDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
