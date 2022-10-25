import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { observeRouteParam } from '~/utils'
import { ItemDetailModule } from '~/widgets/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-housing-detail',
  templateUrl: './housing-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, ItemDetailModule, ScreenshotModule],
  host: {
    class: 'layout-content xl:max-w-md layout-pad-x layout-pad-b',
  }
})
export class HousingDetailComponent {
  public itemId = observeRouteParam(this.route, 'id')
  public constructor(private route: ActivatedRoute) {
    //
  }
}
